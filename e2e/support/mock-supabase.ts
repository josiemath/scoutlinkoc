import type { Page, Route } from "@playwright/test";

/**
 * Answers Supabase Auth and PostgREST requests inside the browser, so the real
 * supabase-js client in the production build can be exercised end to end
 * without a Supabase project. Database rules are tested separately against
 * real Postgres (supabase/tests).
 */
export const MOCK_SUPABASE_URL = "http://127.0.0.1:54399";

export const USER_ID = "00000000-0000-4000-8000-00000000a11c";

export interface MockAccountOptions {
  state?: "pending_verification" | "active" | "suspended" | "deactivated";
  admin?: boolean;
  pendingRequest?: boolean;
}

export function accountJson(email: string, options: MockAccountOptions = {}) {
  return {
    id: USER_ID,
    email,
    display_name: "Alice Rivera",
    bio: "",
    interests: [],
    general_location: "",
    account_state: options.state ?? "pending_verification",
    state_reason: null,
    deletion_requested_at: null,
    created_at: "2026-11-01T17:00:00Z",
    policy_version: "2026-11-draft",
    has_current_consent: false,
    roles: options.admin
      ? [{ id: "r1", role: "council_admin", scope_type: "council", scope_id: null, scope_name: "Council", granted_at: "2026-11-01T17:00:00Z" }]
      : [],
    latest_request: options.pendingRequest
      ? {
          id: "req-1",
          requested_role: "troop_leader",
          service_unit_id: "5e000000-0000-4000-8000-000000000001",
          service_unit_name: "North OC Service Unit (fictional)",
          troop_id: "7e000000-0000-4000-8000-000000000101",
          troop_number: "101",
          note: "",
          status: "pending",
          decision_note: null,
          created_at: "2026-11-10T18:30:00Z",
          decided_at: null
        }
      : null
  };
}

const AFFILIATIONS = [
  {
    service_unit_id: "5e000000-0000-4000-8000-000000000001",
    service_unit_name: "North OC Service Unit (fictional)",
    region: "north",
    troop_id: "7e000000-0000-4000-8000-000000000101",
    troop_number: "101"
  },
  {
    service_unit_id: "5e000000-0000-4000-8000-000000000001",
    service_unit_name: "North OC Service Unit (fictional)",
    region: "north",
    troop_id: "7e000000-0000-4000-8000-000000000404",
    troop_number: "404"
  }
];

const QUEUE = [
  {
    id: "req-9",
    profile_id: "00000000-0000-4000-8000-0000000000b0",
    display_name: "Bea Nguyen",
    email: "bea@example.org",
    requested_role: "troop_leader",
    service_unit_id: "5e000000-0000-4000-8000-000000000001",
    service_unit_name: "North OC Service Unit (fictional)",
    troop_id: "7e000000-0000-4000-8000-000000000101",
    troop_number: "101",
    note: "Co-leader since 2023.",
    status: "pending",
    decision_note: null,
    created_at: "2026-11-10T18:30:00Z",
    decided_at: null
  }
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "access-control-expose-headers": "*"
};

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify(body) });
}

function sessionJson(email: string) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "e2e-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "e2e-refresh-token",
    user: {
      id: USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email,
      email_confirmed_at: "2026-11-01T17:00:00Z",
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: "2026-11-01T17:00:00Z"
    }
  };
}

export interface MockSupabase {
  /** Every RPC call the page made, in order. */
  rpcCalls: { name: string; body: unknown }[];
  /** Change the signed-in account the next get_my_account call returns. */
  setAccount(options: MockAccountOptions): void;
}

export async function mockSupabase(page: Page, initial: MockAccountOptions = {}): Promise<MockSupabase> {
  let accountOptions = initial;
  let email = "alice@example.org";
  const rpcCalls: MockSupabase["rpcCalls"] = [];

  await page.route(`${MOCK_SUPABASE_URL}/**`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(request.url());
    const body = request.postDataJSON() as Record<string, unknown> | null;

    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
      if (body?.password !== "correct horse battery") {
        return json(route, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
      }
      email = String(body.email);
      return json(route, 200, sessionJson(email));
    }
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      return json(route, 200, sessionJson(email));
    }
    if (url.pathname === "/auth/v1/signup") {
      // Email confirmation on: no session until the link is opened.
      return json(route, 200, { id: USER_ID, aud: "authenticated", role: "", email: body?.email, identities: [{ id: "i1" }] });
    }
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: CORS });
    if (url.pathname === "/auth/v1/user") return json(route, 200, sessionJson(email).user);

    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/)?.[1];
    if (rpc) {
      rpcCalls.push({ name: rpc, body });
      switch (rpc) {
        case "get_my_account":
          return json(route, 200, accountJson(email, accountOptions));
        case "list_affiliation_options":
          return json(route, 200, AFFILIATIONS);
        case "submit_onboarding":
          accountOptions = { ...accountOptions, pendingRequest: true };
          return json(route, 200, "req-1");
        case "admin_list_verification_requests":
          return json(route, 200, accountOptions.admin ? QUEUE : []);
        case "submit_contact_message":
          return json(route, 200, null);
        default:
          return json(route, 200, null);
      }
    }
    return json(route, 404, { message: "Not mocked" });
  });

  return {
    rpcCalls,
    setAccount(options) {
      accountOptions = options;
    }
  };
}

/** Signs in through the real form. */
export async function signIn(page: Page, path = "#/login") {
  await page.goto(`./${path}`);
  await page.getByLabel("Email").fill("alice@example.org");
  await page.getByLabel("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
