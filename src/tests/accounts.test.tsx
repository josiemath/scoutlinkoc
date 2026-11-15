import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPendingAuthRedirect } from "@/lib/auth-redirect";
import {
  ADMIN_ROLE,
  authError,
  createFakeSupabase,
  dbError,
  makeAccount,
  makeSession,
  type FakeSupabase
} from "./fake-supabase";
import { renderRoute } from "./test-utils";

const holder = vi.hoisted(() => ({ fake: null as FakeSupabase | null }));

vi.mock("@/lib/supabase", () => ({
  AUTH_STORAGE_KEY: "scoutlink-auth",
  isSupabaseConfigured: true,
  getSupabase: () => Promise.resolve(holder.fake?.client ?? null),
  requireSupabase: async () => {
    if (!holder.fake) throw new Error("accounts_not_configured");
    return holder.fake.client;
  }
}));

function useFake(options: Parameters<typeof createFakeSupabase>[0] = {}) {
  holder.fake = createFakeSupabase(options);
  return holder.fake;
}

const SU = "5e000000-0000-4000-8000-000000000001";
const TROOP = "7e000000-0000-4000-8000-000000000101";
const AFFILIATIONS = [
  { service_unit_id: SU, service_unit_name: "North OC Service Unit", region: "north", troop_id: TROOP, troop_number: "101" },
  { service_unit_id: "5e000000-0000-4000-8000-000000000002", service_unit_name: "Central OC Service Unit", region: "central", troop_id: null, troop_number: null }
];

beforeEach(() => {
  holder.fake = null;
  setPendingAuthRedirect(null);
});

describe("route guards", () => {
  it("sends signed-out visitors to sign in, remembering where they were going", async () => {
    useFake();
    const { router } = renderRoute("/settings");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?next=%2Fsettings");
  });

  it("keeps non-admins out of the verification queue without calling admin functions", async () => {
    const fake = useFake({ session: makeSession(), account: makeAccount({ account_state: "active" }) });
    renderRoute("/admin/verifications");
    expect(await screen.findByRole("heading", { name: "You can't open this page" })).toBeInTheDocument();
    expect(fake.rpcCalls("admin_list_verification_requests")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: /Verification requests/ })).not.toBeInTheDocument();
  });

  it("sends suspended members from editable pages back to their status", async () => {
    useFake({
      session: makeSession(),
      account: makeAccount({ account_state: "suspended", state_reason: "Under review" })
    });
    const { router } = renderRoute("/profile");
    expect(await screen.findByText("Your account is suspended")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard");
    expect(screen.getByText("Reason given: Under review")).toBeInTheDocument();
  });

  it("returns to sign in when the session ends on its own", async () => {
    const fake = useFake({ session: makeSession() });
    const { router } = renderRoute("/dashboard");
    expect(await screen.findByRole("heading", { name: "Hi, Alice Rivera" })).toBeInTheDocument();
    act(() => fake.expireSession());
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("shows the dashboard link in the public header when signed in", async () => {
    useFake({ session: makeSession() });
    renderRoute("/about");
    const header = await screen.findByRole("banner");
    expect(await within(header).findByRole("link", { name: "Your dashboard" })).toBeInTheDocument();
    expect(within(header).queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });
});

describe("sign in and sign up", () => {
  it("signs in and continues to the requested page", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    const { router } = renderRoute("/login?next=%2Fsettings");
    expect(screen.queryByText("Accounts aren't open yet")).not.toBeInTheDocument();
    await user.type(await screen.findByLabelText("Email"), " alice@example.org ");
    await user.type(screen.getByLabelText("Password"), "correct horse battery");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/settings"));
    expect(fake.client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "alice@example.org", password: "correct horse battery" });
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("ignores next links that point to another site", async () => {
    const user = userEvent.setup();
    useFake();
    const { router } = renderRoute("/login?next=%2F%2Fevil.example");
    await user.type(await screen.findByLabelText("Email"), "alice@example.org");
    await user.type(screen.getByLabelText("Password"), "correct horse battery");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
  });

  it("explains a wrong password without showing server text", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    fake.client.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: authError("invalid_credentials") } as never);
    renderRoute("/login");
    await user.type(await screen.findByLabelText("Email"), "alice@example.org");
    await user.type(screen.getByLabelText("Password"), "wrong password!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByText("That email and password don't match an account. Check them and try again.");
    expect(alert).toBeInTheDocument();
    expect(screen.queryByText(/server text/)).not.toBeInTheDocument();
    await waitFor(() => expect(document.getElementById("login-error")).toHaveFocus());
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("asks new members to confirm their email, linking back to onboarding", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    renderRoute("/signup");
    await user.type(await screen.findByLabelText("Email"), "new.leader@example.org");
    await user.type(screen.getByLabelText("Password"), "a long passphrase");
    await user.type(screen.getByLabelText("Confirm password"), "a long passphrase");
    await user.click(screen.getByRole("checkbox", { name: "I'm 18 or older" }));
    await user.click(screen.getByRole("checkbox", { name: /I agree to the Terms/ }));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    const [input] = fake.client.auth.signUp.mock.calls[0]!;
    expect(input.email).toBe("new.leader@example.org");
    const redirect = new URL(input.options!.emailRedirectTo!);
    expect(redirect.searchParams.get("next")).toBe("/onboarding");
    expect(redirect.hash).toBe("");
  });

  it("sends the same reset message whether or not the account exists", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    fake.client.auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: authError("user_not_found") } as never);
    renderRoute("/forgot-password");
    await user.type(await screen.findByLabelText("Email"), "nobody@example.org");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    const [, options] = fake.client.auth.resetPasswordForEmail.mock.calls[0]!;
    expect(new URL(options!.redirectTo!).searchParams.get("next")).toBe("/reset-password");
  });

  it("only offers the new-password form after opening a reset link", async () => {
    useFake();
    renderRoute("/reset-password");
    expect(await screen.findByText("Open the link from your email")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });
});

describe("email links", () => {
  it("exchanges the code and continues to the next page", async () => {
    const fake = useFake();
    setPendingAuthRedirect({ code: "one-time-code", error: null, next: "/onboarding" });
    const { router } = renderRoute("/auth/callback");
    await waitFor(() => expect(router.state.location.pathname).toBe("/onboarding"));
    expect(fake.client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(fake.client.auth.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
  });

  it("lets someone choose a new password after opening a reset link", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    setPendingAuthRedirect({ code: "recovery-code", error: null, next: "/reset-password" });
    const { router } = renderRoute("/auth/callback");
    await user.type(await screen.findByLabelText("New password"), "a fresh passphrase");
    await user.type(screen.getByLabelText("Confirm new password"), "a fresh passphrase");
    await user.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(fake.client.auth.updateUser).toHaveBeenCalledWith({ password: "a fresh passphrase" });
  });

  it("doesn't let an ordinary session skip the current-password check", async () => {
    useFake({ session: makeSession() });
    renderRoute("/reset-password");
    expect(await screen.findByText("You're already signed in")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("explains expired links", async () => {
    const fake = useFake();
    setPendingAuthRedirect({ code: null, error: "otp_expired", next: "/onboarding" });
    renderRoute("/auth/callback");
    expect(await screen.findByText("This link has expired or was already used. Request a new one.")).toBeInTheDocument();
    expect(fake.client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});

describe("onboarding", () => {
  it("requires a troop for troop roles and sends exactly what was chosen", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession() });
    fake.onRpc("list_affiliation_options", () => ({ data: AFFILIATIONS, error: null }));
    fake.onRpc("submit_onboarding", () => ({ data: "request-id", error: null }));
    const { router } = renderRoute("/onboarding");

    await user.click(await screen.findByRole("radio", { name: /Troop leader/ }));
    await user.selectOptions(screen.getByLabelText("Service unit"), SU);
    await user.click(screen.getByRole("checkbox", { name: /I agree to the current Terms/ }));
    await user.click(screen.getByRole("button", { name: "Send verification request" }));
    expect(await screen.findByText("Choose the troop you volunteer with.")).toBeInTheDocument();
    expect(fake.rpcCalls("submit_onboarding")).toHaveLength(0);

    await user.selectOptions(screen.getByLabelText("Troop"), TROOP);
    await user.type(screen.getByLabelText("Interests (optional)"), "STEM, outdoors, stem");
    await user.click(screen.getByRole("button", { name: "Send verification request" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(fake.rpcCalls("submit_onboarding")[0]).toEqual({
      p_display_name: "Alice Rivera",
      p_requested_role: "troop_leader",
      p_service_unit_id: SU,
      p_troop_id: TROOP,
      p_interests: ["STEM", "outdoors"],
      p_note: "",
      p_policy_version: "2026-11-draft"
    });
  });

  it("doesn't send a troop for service unit coordinators", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession(), account: makeAccount({ has_current_consent: true }) });
    fake.onRpc("list_affiliation_options", () => ({ data: AFFILIATIONS, error: null }));
    fake.onRpc("submit_onboarding", () => ({ data: "request-id", error: null }));
    renderRoute("/onboarding");

    await user.click(await screen.findByRole("radio", { name: /Service unit coordinator/ }));
    expect(screen.queryByLabelText("Troop")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Service unit"), "5e000000-0000-4000-8000-000000000002");
    await user.click(screen.getByRole("button", { name: "Send verification request" }));
    await waitFor(() => expect(fake.rpcCalls("submit_onboarding")).toHaveLength(1));
    expect(fake.rpcCalls("submit_onboarding")[0]).toMatchObject({ p_requested_role: "service_unit_coordinator", p_troop_id: null });
  });

  it("shows the server's reason when a request is refused", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession(), account: makeAccount({ has_current_consent: true }) });
    fake.onRpc("list_affiliation_options", () => ({ data: AFFILIATIONS, error: null }));
    fake.onRpc("submit_onboarding", () => ({ data: null, error: dbError("rate_limited") }));
    renderRoute("/onboarding");
    await user.click(await screen.findByRole("radio", { name: /Service unit coordinator/ }));
    await user.selectOptions(screen.getByLabelText("Service unit"), SU);
    await user.click(screen.getByRole("button", { name: "Send verification request" }));
    expect(await screen.findByText("You've done that several times recently. Wait a while, then try again.")).toBeInTheDocument();
  });

  it("shows a pending request instead of the form, and can withdraw it", async () => {
    const user = userEvent.setup();
    const fake = useFake({
      session: makeSession(),
      account: makeAccount({
        latest_request: {
          id: "req-1",
          requested_role: "troop_leader",
          service_unit_id: SU,
          service_unit_name: "North OC Service Unit",
          troop_id: TROOP,
          troop_number: "101",
          note: "",
          status: "pending",
          decision_note: null,
          created_at: "2026-11-10T18:30:00Z",
          decided_at: null
        }
      })
    });
    renderRoute("/onboarding");
    expect(await screen.findByText("Waiting for review")).toBeInTheDocument();
    expect(screen.getByText("Troop 101")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Withdraw request" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Withdraw request" }));
    await waitFor(() => expect(fake.rpcCalls("withdraw_my_verification_request")).toHaveLength(1));
  });
});

describe("profile and settings", () => {
  it("saves only the editable profile fields", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession() });
    renderRoute("/profile");
    const bio = await screen.findByLabelText("About you (optional)");
    await user.type(bio, "Leader of a Cadette troop.");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(fake.profileUpdate).toHaveBeenCalledTimes(1));
    expect(fake.profileUpdate.mock.calls[0]).toEqual([
      { display_name: "Alice Rivera", general_location: "", bio: "Leader of a Cadette troop.", interests: [] },
      "00000000-0000-4000-8000-00000000a11c"
    ]);
  });

  it("checks the current password before changing it", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession() });
    fake.client.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null, user: null }, error: authError("invalid_credentials") } as never);
    renderRoute("/settings");
    await user.type(await screen.findByLabelText("Current password"), "not my password");
    await user.type(screen.getByLabelText("New password"), "a brand new passphrase");
    await user.type(screen.getByLabelText("Confirm new password"), "a brand new passphrase");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Your current password is incorrect.")).toBeInTheDocument();
    expect(fake.client.auth.updateUser).not.toHaveBeenCalled();
  });

  it("asks for the word 'delete' before requesting deletion, then signs out", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession() });
    const { router } = renderRoute("/settings");
    await user.click(await screen.findByRole("button", { name: "Request account deletion" }));
    const dialog = await screen.findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "Request deletion" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Type “delete” to confirm/), "delete");
    await user.click(confirm);
    await waitFor(() => expect(fake.rpcCalls("request_my_account_deletion")).toEqual([{ p_reason: null }]));
    await waitFor(() => expect(fake.client.auth.signOut).toHaveBeenCalled());
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });
});

describe("verification queue", () => {
  const request = {
    id: "req-9",
    profile_id: "00000000-0000-4000-8000-0000000000b0",
    display_name: "Bea Nguyen",
    email: "bea@example.org",
    requested_role: "troop_leader",
    service_unit_id: SU,
    service_unit_name: "North OC Service Unit",
    troop_id: TROOP,
    troop_number: "101",
    note: "Co-leader since 2023.",
    status: "pending",
    decision_note: null,
    created_at: "2026-11-10T18:30:00Z",
    decided_at: null
  };

  it("approves a request after confirmation", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession(), account: makeAccount({ account_state: "active", roles: [ADMIN_ROLE] }) });
    fake.onRpc("admin_list_verification_requests", () => ({ data: [request], error: null }));
    renderRoute("/admin/verifications");
    expect(await screen.findByRole("heading", { name: "Bea Nguyen" })).toBeInTheDocument();
    expect(fake.rpcCalls("admin_list_verification_requests")[0]).toEqual({ p_status: "pending" });

    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/verified troop leader for Troop 101 in North OC Service Unit/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() =>
      expect(fake.rpcCalls("admin_decide_verification")).toEqual([{ p_request_id: "req-9", p_approve: true, p_note: null }])
    );
  });

  it("requires a reason to decline", async () => {
    const user = userEvent.setup();
    const fake = useFake({ session: makeSession(), account: makeAccount({ account_state: "active", roles: [ADMIN_ROLE] }) });
    fake.onRpc("admin_list_verification_requests", () => ({ data: [request], error: null }));
    renderRoute("/admin/verifications");
    await user.click(await screen.findByRole("button", { name: "Decline" }));
    const dialog = await screen.findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "Decline request" });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Reason the volunteer will see"), "No matching volunteer record.");
    await user.click(confirm);
    await waitFor(() =>
      expect(fake.rpcCalls("admin_decide_verification")).toEqual([
        { p_request_id: "req-9", p_approve: false, p_note: "No matching volunteer record." }
      ])
    );
  });

  it("doesn't offer to approve your own request", async () => {
    const fake = useFake({ session: makeSession(), account: makeAccount({ account_state: "active", roles: [ADMIN_ROLE] }) });
    fake.onRpc("admin_list_verification_requests", () => ({
      data: [{ ...request, profile_id: "00000000-0000-4000-8000-00000000a11c" }],
      error: null
    }));
    renderRoute("/admin/verifications");
    expect(await screen.findByText(/This is your own request/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});

describe("contact form", () => {
  async function fillContact(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText("Your name"), "Dana R.");
    await user.type(screen.getByLabelText("Email"), "dana@example.org");
    await user.selectOptions(screen.getByLabelText("Topic"), "pilot");
    await user.type(screen.getByLabelText("Message"), "We'd like to talk about a pilot in our service unit.");
    await user.click(screen.getByRole("button", { name: "Send message" }));
  }

  it("sends the message through the database function", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    renderRoute("/contact");
    await fillContact(user);
    expect(await screen.findByText("Message sent")).toBeInTheDocument();
    expect(fake.rpcCalls("submit_contact_message")[0]).toEqual({
      p_name: "Dana R.",
      p_email: "dana@example.org",
      p_topic: "pilot",
      p_message: "We'd like to talk about a pilot in our service unit.",
      p_website: ""
    });
  });

  it("explains rate limits", async () => {
    const user = userEvent.setup();
    const fake = useFake();
    fake.onRpc("submit_contact_message", () => ({ data: null, error: dbError("rate_limited") }));
    renderRoute("/contact");
    await fillContact(user);
    expect(await screen.findByText("You've done that several times recently. Wait a while, then try again.")).toBeInTheDocument();
    expect(screen.queryByText("Message sent")).not.toBeInTheDocument();
  });
});
