import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import { PublicLayout, PublicLayoutFallback } from "@/components/layout/PublicLayout";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";
import type { AppRouteHandle } from "@/hooks/use-app-account";
import NotFoundPage from "@/pages/public/NotFoundPage";

/** Code-splits each page: the module's default export becomes the route component. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

/**
 * Route table. Pages are lazy-loaded so a visitor only downloads what they open.
 * Signed-in pages sit under AppLayout, which checks the session and the
 * account's verified roles; the database enforces the same rules with RLS.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    Component: PublicLayout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: PublicLayoutFallback,
    children: [
      { index: true, lazy: page(() => import("@/pages/public/HomePage")) },
      { path: "about", lazy: page(() => import("@/pages/public/AboutPage")) },
      { path: "features", lazy: page(() => import("@/pages/public/FeaturesPage")) },
      { path: "how-it-works", lazy: page(() => import("@/pages/public/HowItWorksPage")) },
      { path: "safety", lazy: page(() => import("@/pages/public/SafetyPage")) },
      { path: "contact", lazy: page(() => import("@/pages/public/ContactPage")) },
      { path: "privacy-policy", lazy: page(() => import("@/pages/public/PrivacyPolicyPage")) },
      { path: "terms", lazy: page(() => import("@/pages/public/TermsPage")) },
      { path: "login", lazy: page(() => import("@/pages/auth/LoginPage")) },
      { path: "signup", lazy: page(() => import("@/pages/auth/SignupPage")) },
      { path: "forgot-password", lazy: page(() => import("@/pages/auth/ForgotPasswordPage")) },
      { path: "reset-password", lazy: page(() => import("@/pages/auth/ResetPasswordPage")) },
      { path: "auth/callback", lazy: page(() => import("@/pages/auth/AuthCallbackPage")) },
      // The 404 page ships in the main bundle so the error boundary can show it without another download.
      { path: "404", Component: NotFoundPage },
      { path: "*", Component: NotFoundPage }
    ]
  },
  {
    // Loaded only when someone opens a signed-in page, with the account code it needs.
    lazy: async () => ({ Component: (await import("@/components/layout/AppLayout")).AppLayout }),
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: PublicLayoutFallback,
    children: [
      { path: "dashboard", lazy: page(() => import("@/pages/app/DashboardPage")) },
      { path: "onboarding", handle: { access: "editable" } satisfies AppRouteHandle, lazy: page(() => import("@/pages/app/OnboardingPage")) },
      { path: "profile", handle: { access: "editable" } satisfies AppRouteHandle, lazy: page(() => import("@/pages/app/ProfilePage")) },
      { path: "settings", lazy: page(() => import("@/pages/app/SettingsPage")) },
      {
        path: "admin/verifications",
        handle: { access: "admin" } satisfies AppRouteHandle,
        lazy: page(() => import("@/pages/admin/AdminVerificationsPage"))
      }
    ]
  }
];

/** Pages that need a signed-in account. */
export const APP_PATHS = ["/dashboard", "/onboarding", "/profile", "/settings", "/admin/verifications"] as const;

/** Paths that exist as public pages (used by tests to check every link resolves). */
export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/features",
  "/how-it-works",
  "/safety",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/404"
] as const;
