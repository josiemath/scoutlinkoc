import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "./test-utils";

describe("account forms", () => {
  it("login shows field errors and never pretends to sign in", async () => {
    const user = userEvent.setup();
    renderRoute("/login");
    const submit = await screen.findByRole("button", { name: "Sign in" });

    await user.click(submit);
    expect(await screen.findByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Email"), "leader@example.org");
    await user.type(screen.getByLabelText("Password"), "anything at all");
    await user.click(submit);

    // A valid submission moves focus to the honest "accounts aren't open" notice.
    await waitFor(() => expect(document.getElementById("login-closed-notice")).toHaveFocus());
    expect(screen.getByText("Accounts aren't open yet")).toBeInTheDocument();
  });

  it("signup explains mismatched passwords and missing agreements", async () => {
    const user = userEvent.setup();
    renderRoute("/signup");
    await user.type(await screen.findByLabelText("Email"), "leader@example.org");
    await user.type(screen.getByLabelText("Password"), "a long passphrase");
    await user.type(screen.getByLabelText("Confirm password"), "a different phrase");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("These passwords don't match.")).toBeInTheDocument();
    expect(screen.getByText("ScoutLink OC accounts are for adults 18 and older right now.")).toBeInTheDocument();
    expect(screen.getByText("Agree to the Terms and Privacy Policy to continue.")).toBeInTheDocument();
  });

  it("password fields can be revealed for checking", async () => {
    const user = userEvent.setup();
    renderRoute("/login");
    const password = await screen.findByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("contact form validates topic and message length", async () => {
    const user = userEvent.setup();
    renderRoute("/contact");
    await user.click(await screen.findByRole("button", { name: "Check and send" }));
    expect(await screen.findByText("Choose a topic.")).toBeInTheDocument();
    expect(screen.getByText("Add a little more detail (at least 20 characters).")).toBeInTheDocument();
    expect(screen.getByText("Messages can't be sent yet")).toBeInTheDocument();
  });
});
