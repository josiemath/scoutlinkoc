import { z } from "zod";

/**
 * Shared form schemas. The same rules are enforced again by the database and
 * Supabase Auth; client validation exists to give fast, clear feedback.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter your email address." })
  .max(254, { error: "That email address is too long." })
  .pipe(z.email({ error: "Enter a valid email address, like name@example.com." }));

/**
 * Passwords: at least 12 characters (NIST SP 800-63B recommends length over
 * composition rules) and at most 72 bytes, the bcrypt limit Supabase Auth uses.
 */
export const passwordSchema = z
  .string()
  .min(12, { error: "Use at least 12 characters." })
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    error: "Use 72 characters or fewer."
  })
  .refine((value) => value.trim().length === value.length, {
    error: "Remove spaces from the start or end of your password."
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." })
});

const mustBeChecked = (message: string) => z.boolean().refine((value) => value, { error: message });

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Re-enter your password." }),
    isAdult: mustBeChecked("ScoutLink OC accounts are for adults 18 and older right now."),
    acceptsPolicies: mustBeChecked("Agree to the Terms and Privacy Policy to continue.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "These passwords don't match.",
    path: ["confirmPassword"]
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Re-enter your new password." })
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "These passwords don't match.",
    path: ["confirmPassword"]
  });

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "pilot", label: "Interest in a council pilot" },
  { value: "accessibility", label: "Accessibility problem" },
  { value: "safety", label: "Safety or privacy concern" },
  { value: "bug", label: "Something isn't working" }
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Enter your name." })
    .max(80, { error: "Use 80 characters or fewer." }),
  email: emailSchema,
  topic: z.enum(
    CONTACT_TOPICS.map((topic) => topic.value) as [string, ...string[]],
    { error: "Choose a topic." }
  ),
  message: z
    .string()
    .trim()
    .min(20, { error: "Add a little more detail (at least 20 characters)." })
    .max(2000, { error: "Keep your message under 2,000 characters." }),
  /** Honeypot. Hidden from people; bots that fill every field get rejected. */
  website: z.string().max(0, { error: "Leave this field empty." })
});

/** Comma-separated interests, checked the same way the database checks them. */
const interestsField = z
  .string()
  .max(600, { error: "That's a lot of interests. Keep it to 12 short ones." })
  .refine((value) => splitTags(value).length <= 12, { error: "List up to 12 interests." })
  .refine((value) => splitTags(value).every((tag) => tag.length <= 40), { error: "Keep each interest to 40 characters or fewer." });

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const displayNameField = z
  .string()
  .trim()
  .min(2, { error: "Enter the name other volunteers know you by." })
  .max(80, { error: "Use 80 characters or fewer." });

export const ONBOARDING_ROLES = ["troop_leader", "adult_volunteer", "service_unit_coordinator"] as const;
export const ROLES_NEEDING_TROOP: readonly string[] = ["troop_leader", "adult_volunteer"];

export const onboardingSchema = z
  .object({
    displayName: displayNameField,
    requestedRole: z.enum(ONBOARDING_ROLES, { error: "Choose the role you want verified." }),
    serviceUnitId: z.string().min(1, { error: "Choose your service unit." }),
    troopId: z.string(),
    interests: interestsField,
    note: z.string().trim().max(1000, { error: "Keep your note under 1,000 characters." }),
    acceptsPolicies: z.boolean().refine((value) => value, { error: "Agree to the Terms and Privacy Policy to continue." })
  })
  .refine((data) => !ROLES_NEEDING_TROOP.includes(data.requestedRole) || data.troopId !== "", {
    error: "Choose the troop you volunteer with.",
    path: ["troopId"]
  });

export const profileSchema = z.object({
  displayName: displayNameField,
  generalLocation: z.string().trim().max(80, { error: "Use 80 characters or fewer." }),
  bio: z.string().trim().max(600, { error: "Keep your bio under 600 characters." }),
  interests: interestsField
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Enter your current password." }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Re-enter your new password." })
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "These passwords don't match.",
    path: ["confirmPassword"]
  })
  .refine((data) => data.password !== data.currentPassword, {
    error: "Choose a password different from your current one.",
    path: ["password"]
  });

export const decisionSchema = z.object({
  note: z.string().trim().max(1000, { error: "Keep the note under 1,000 characters." })
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
export type OnboardingValues = z.input<typeof onboardingSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
