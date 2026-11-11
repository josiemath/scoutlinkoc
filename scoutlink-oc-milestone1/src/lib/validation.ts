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

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
