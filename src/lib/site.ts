/** Site-wide constants and navigation. Every href here must match a route (see src/tests/site.test.ts). */

export const SITE_NAME = "ScoutLink OC";

export const INDEPENDENCE_NOTICE =
  "Independent ScoutLink OC demonstration. Not an official Girl Scouts of Orange County service unless separately authorized.";

export interface NavItem {
  label: string;
  href: string;
}

/** Primary public navigation (header and mobile menu). */
export const PRIMARY_NAV: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Safety", href: "/safety" },
  { label: "Contact", href: "/contact" }
];

/** Footer navigation, grouped. */
export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Platform",
    items: [
      { label: "About", href: "/about" },
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Safety", href: "/safety" }
    ]
  },
  {
    heading: "Account",
    items: [
      { label: "Sign in", href: "/login" },
      { label: "Request access", href: "/signup" },
      { label: "Forgot password", href: "/forgot-password" }
    ]
  },
  {
    heading: "Legal and contact",
    items: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" }
    ]
  }
];

/** Girl Scout grade levels, in order. Colors are used as information (level markers), not decoration. */
export const GIRL_SCOUT_LEVELS = [
  { id: "daisy", name: "Daisy", grades: "K–1" },
  { id: "brownie", name: "Brownie", grades: "2–3" },
  { id: "junior", name: "Junior", grades: "4–5" },
  { id: "cadette", name: "Cadette", grades: "6–8" },
  { id: "senior", name: "Senior", grades: "9–10" },
  { id: "ambassador", name: "Ambassador", grades: "11–12" }
] as const;

export type GirlScoutLevel = (typeof GIRL_SCOUT_LEVELS)[number]["id"];
