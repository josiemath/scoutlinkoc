import type { ReactNode } from "react";

/** Title block for pages inside the signed-in area. */
export function AppPageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
