# User guide

How to use ScoutLink OC as a volunteer and as an administrator. This guide grows with each release; it covers what exists today (accounts, verification, profile and settings).

> ScoutLink OC is an independent demonstration, not an official Girl Scouts of Orange County service. Troops and service units marked "fictional demo" are made up. Accounts are for adults 18 and older.

## For volunteers

### Create an account

1. Choose **Request access** at the top of any page.
2. Enter your email and a password of at least 12 characters. A short phrase is easier to remember than a jumble of symbols.
3. Confirm you're 18 or older and agree to the Terms and Privacy Policy (both still drafts), then **Create account**.
4. Open the email we send and click the link **in the same browser** you used to sign up. You'll land on the verification page, signed in.

The email can take a few minutes; check spam or promotions folders. If the link says it expired, sign in and request a new one, or use **Forgot password**.

### Ask to be verified

A new account can't see any troop information until a council administrator confirms your role. On **Verification**:

1. Enter the display name other volunteers know you by.
2. Choose your role: **Troop leader**, **Adult volunteer** or **Service unit coordinator**.
3. Choose your service unit and, for troop roles, your troop.
4. Optionally add interests (separated by commas) and a note for the administrator, such as how long you've led the troop. Don't include girls' names or contact details.
5. Agree to the current Terms and Privacy Policy and **Send verification request**.

Your **Dashboard** then shows the request as waiting for review. You can withdraw it from the Verification page and send a corrected one. If it isn't approved, the dashboard shows the administrator's note and you can try again.

### Once you're verified

The dashboard says "You're verified" and lists your roles. Troop directory, events and projects open to verified volunteers as they're released. You can request an additional role (for example a second troop) from **Verification**.

### Edit your profile

**Profile** holds what other verified volunteers will see: display name, general area (a city or region only, never an address), a short bio and interests. Your email is visible only to administrators.

### Settings

- **Appearance:** light, dark, or match your device. Saved in this browser.
- **Password:** enter your current password and a new one. Forgot it? Sign out and use **Forgot password**.
- **Signed-in devices:** **Sign out of all devices** if you used a shared computer or lost a phone.
- **Deactivate account:** hides your profile and signs you out. To come back, contact the project team.
- **Request account deletion:** type "delete" to confirm. Your account is deactivated at once and an administrator deletes it and your profile.

### Account statuses

| Status | What it means |
| --- | --- |
| Waiting for verification | New account. You can edit your profile and send a verification request; you can't see troop information yet. |
| Verified | An administrator confirmed your role. |
| Suspended | An administrator paused the account, usually while looking into a report. You can still see the reason and sign out. Contact the project team with questions. |
| Deactivated | You (or an administrator) turned the account off. |

### Sign-in problems

- **"That email and password don't match an account"**: check for typos, or use **Forgot password**.
- **"Confirm your email first"**: open the confirmation link, then sign in.
- **"Your session ended"**: you were signed out, perhaps from another device or after a long time away. Sign in again; you'll return to the page you were on.
- **The reset or confirmation link didn't work**: links work once, expire after an hour, and must be opened in the browser that asked for them. Request a new one.

## For administrators

Council and platform administrators see **Verification requests** in the menu.

### Review verification requests

1. Open **Verification requests**. Pending requests are listed oldest first, with the volunteer's name, email, requested role, service unit, troop and note.
2. Check the request against council volunteer records **before** approving.
3. **Approve** grants exactly the role and troop or service unit shown and activates the account. An optional note is saved with the request.
4. **Decline** needs a reason; the volunteer sees it on their dashboard and can send a corrected request.

You can't review your own request; another administrator has to. Use the status filters to see approved, declined and withdrawn requests.

### What only platform administrators can do

- Appoint council administrators and other platform administrators. Council administrators can grant volunteer roles but not administrator roles, and nobody can change their own roles.
- Youth roles (Girl Scout member, parent or guardian) can't be granted by anyone while youth access is turned off.

Screens for granting roles, suspending accounts, reading contact messages and the audit log arrive in the administration release. Until then those actions are available as tested database functions (see [DATABASE.md](DATABASE.md)) and through the Supabase dashboard. Every administrative action is recorded in the audit log.

### Completing a deletion request

See [DEPLOYMENT.md](DEPLOYMENT.md#completing-a-deletion-request).
