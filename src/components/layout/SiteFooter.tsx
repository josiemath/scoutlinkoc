import { InfoIcon } from "lucide-react";
import { Link } from "react-router";
import { currentYearInZone } from "@/lib/date";
import { config } from "@/lib/env";
import { FOOTER_NAV, INDEPENDENCE_NOTICE } from "@/lib/site";
import { Wordmark } from "./Logo";

export function SiteFooter() {
  const showNotice = config.authorizationReference === null;

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A place for troops, service units and volunteers across Orange County to find each other, plan together and
            support girl-led projects.
          </p>
        </div>
        {FOOTER_NAV.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="font-heading text-sm font-bold">{group.heading}</h2>
            <ul className="mt-3 grid gap-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
          {showNotice ? (
            <p className="flex max-w-3xl items-start gap-2 font-medium text-foreground" data-testid="independence-notice">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {INDEPENDENCE_NOTICE}
            </p>
          ) : (
            <p className="max-w-3xl">Operated with authorization reference {config.authorizationReference}.</p>
          )}
          <p className="shrink-0">© {currentYearInZone()} ScoutLink OC. Girl Scout names and marks belong to Girl Scouts of the USA.</p>
        </div>
      </div>
    </footer>
  );
}
