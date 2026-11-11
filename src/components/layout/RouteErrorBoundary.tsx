import { HomeIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-page-meta";
import NotFoundPage from "@/pages/public/NotFoundPage";

/**
 * Catches errors thrown while loading or rendering a route. A failed code-split
 * import usually means the site was updated while the page was open, so the
 * primary action reloads.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  usePageMeta("Something went wrong");

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div role="alert" className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm">
        <TriangleAlertIcon className="size-8 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold">This page didn't load</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {isChunkError
            ? "ScoutLink OC may have been updated since you opened it. Reloading gets the latest version."
            : "Something went wrong while showing this page. Try again, and if it keeps happening, let us know through the contact page."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCwIcon aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link to="/" reloadDocument>
              <HomeIcon aria-hidden="true" />
              Go to the home page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
