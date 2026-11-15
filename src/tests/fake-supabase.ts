import { vi } from "vitest";
import type { Account } from "@/lib/account";

/**
 * An in-memory stand-in for the parts of the Supabase client the app uses.
 * Unit tests check what the interface sends and how it reacts; the database
 * rules themselves are tested against real Postgres in supabase/tests.
 */

type AuthEvent = "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT" | "PASSWORD_RECOVERY" | "TOKEN_REFRESHED" | "USER_UPDATED";
type Listener = (event: AuthEvent, session: FakeSession | null) => void;
type RpcResult = { data: unknown; error: unknown };
type RpcHandler = (args: Record<string, unknown> | undefined) => RpcResult | Promise<RpcResult>;

export interface FakeSession {
  access_token: string;
  user: { id: string; email: string };
}

export const ALICE_ID = "00000000-0000-4000-8000-00000000a11c";

export function makeSession(email = "alice@example.org", id = ALICE_ID): FakeSession {
  return { access_token: "test-token", user: { id, email } };
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: ALICE_ID,
    email: "alice@example.org",
    display_name: "Alice Rivera",
    bio: "",
    interests: [],
    general_location: "",
    account_state: "pending_verification",
    state_reason: null,
    deletion_requested_at: null,
    created_at: "2026-11-01T17:00:00Z",
    policy_version: "2026-11-draft",
    has_current_consent: false,
    roles: [],
    latest_request: null,
    ...overrides
  };
}

export const ADMIN_ROLE = {
  id: "r-admin",
  role: "council_admin" as const,
  scope_type: "council" as const,
  scope_id: null,
  scope_name: "Council",
  granted_at: "2026-11-01T17:00:00Z"
};

export function authError(code: string, message = "server text that must not be shown") {
  return Object.assign(new Error(message), { name: "AuthApiError", code, status: 400 });
}

export function dbError(message: string, code = "P0001") {
  return { message, code, details: null, hint: null };
}

export function createFakeSupabase(options: { session?: FakeSession | null; account?: Account } = {}) {
  let session: FakeSession | null = options.session ?? null;
  const listeners = new Set<Listener>();
  const emit = (event: AuthEvent, next: FakeSession | null) => {
    session = next;
    for (const listener of listeners) listener(event, next);
  };

  const rpcHandlers: Record<string, RpcHandler> = {
    get_my_account: () => ({ data: options.account ?? makeAccount(), error: null }),
    list_affiliation_options: () => ({ data: [], error: null })
  };

  const profileUpdate = vi.fn<(values: Record<string, unknown>, id: string) => RpcResult>(() => ({
    data: [{ id: session?.user.id ?? "" }],
    error: null
  }));

  const client = {
    auth: {
      onAuthStateChange: vi.fn((listener: Listener) => {
        listeners.add(listener);
        queueMicrotask(() => listener("INITIAL_SESSION", session));
        return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
      }),
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      signInWithPassword: vi.fn(async ({ email }: { email: string; password: string }) => {
        const next = makeSession(email);
        emit("SIGNED_IN", next);
        return { data: { session: next, user: next.user }, error: null };
      }),
      signUp: vi.fn(async (_input: { email: string; password: string; options?: { emailRedirectTo?: string } }) => ({
        data: { session: null, user: null },
        error: null
      })),
      resetPasswordForEmail: vi.fn(async (_email: string, _options?: { redirectTo?: string }) => ({ data: {}, error: null })),
      updateUser: vi.fn(async (_attributes: { password?: string }) => ({ data: { user: session?.user ?? null }, error: null })),
      signOut: vi.fn(async (_options?: { scope?: string }) => {
        emit("SIGNED_OUT", null);
        return { error: null };
      }),
      exchangeCodeForSession: vi.fn(async (code: string) => {
        const next = makeSession();
        emit(code.startsWith("recovery") ? "PASSWORD_RECOVERY" : "SIGNED_IN", next);
        return { data: { session: next, user: next.user }, error: null };
      })
    },
    rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
      const handler = rpcHandlers[name];
      return handler ? handler(args) : { data: null, error: null };
    }),
    from: vi.fn((table: string) => {
      if (table !== "profiles") throw new Error(`Unexpected table ${table}`);
      return {
        update: (values: Record<string, unknown>) => ({
          eq: (_column: string, id: string) => ({
            select: async () => profileUpdate(values, id)
          })
        })
      };
    })
  };

  return {
    client,
    profileUpdate,
    /** Replace how a database function responds. */
    onRpc(name: string, handler: RpcHandler) {
      rpcHandlers[name] = handler;
    },
    /** Simulate Supabase ending the session (expired refresh token, signed out elsewhere). */
    expireSession() {
      emit("SIGNED_OUT", null);
    },
    rpcCalls(name: string) {
      return client.rpc.mock.calls.filter(([called]) => called === name).map(([, args]) => args);
    }
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
