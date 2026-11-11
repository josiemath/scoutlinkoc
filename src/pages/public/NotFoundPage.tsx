import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { PRIMARY_NAV } from "@/lib/site";

export default function NotFoundPage() {
  usePageMeta("Page not found");

  return (
    <div className="container-page py-16 md:py-24">
      <svg viewBox="0 0 260 90" aria-hidden="true" className="h-auto w-56">
        <path d="M20 60 C 70 10, 110 90, 150 45 S 220 20, 240 40" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" className="stroke-primary" />
        <circle cx="20" cy="60" r="12" className="fill-primary" />
        <circle cx="240" cy="40" r="12" fill="none" strokeWidth="2" strokeDasharray="4 4" className="stroke-input" />
      </svg>
      <p className="mt-6 font-heading text-sm font-bold text-primary">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">This trail doesn't lead anywhere</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist or has moved. Check the address, or pick up from one of these:
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {PRIMARY_NAV.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className="inline-flex min-h-10 items-center rounded-full border border-input bg-card px-4 text-sm font-semibold hover:bg-accent">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8">
        <Link to="/">
          <ArrowLeftIcon aria-hidden="true" />
          Back to the home page
        </Link>
      </Button>
    </div>
  );
}
