import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

/** Breadcrumb trail; the last item is the current page and is marked aria-current. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link to={item.href} className="rounded-sm underline-offset-4 hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-foreground")}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRightIcon className="size-3.5" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
