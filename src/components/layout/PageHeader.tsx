import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Trail before the current page. "Home" is added automatically. */
  breadcrumbs?: Crumb[];
  children?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs = [], children }: PageHeaderProps) {
  return (
    <section className="border-b bg-secondary/60 dark:bg-secondary/40">
      <div className="container-page py-10 md:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...breadcrumbs, { label: title }]} />
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold md:text-4xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
