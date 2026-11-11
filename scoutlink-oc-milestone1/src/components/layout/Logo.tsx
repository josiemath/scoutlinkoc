import { cn } from "@/lib/utils";

/** Original provisional ScoutLink OC mark: three troops joined by a shared trail. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="12" fill="none" strokeWidth="1.6" strokeDasharray="3 3" className="stroke-primary-foreground/45" />
      <path d="M16 42 C 22 28, 30 46, 34 32 S 44 20, 48 22" fill="none" strokeWidth="4.5" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle cx="16" cy="42" r="6" className="fill-primary-foreground" />
      <circle cx="34" cy="32" r="6" className="fill-primary-foreground" />
      <circle cx="48" cy="22" r="7" fill="#B8E3C8" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-lg leading-none font-extrabold tracking-tight text-foreground">
        ScoutLink <span className="font-semibold text-primary">OC</span>
      </span>
    </span>
  );
}
