import { Skeleton } from "@/components/ui/misc";

/** Shown while a page's code is downloading. */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="container-page py-12">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-10 w-full max-w-xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-5 w-full max-w-lg" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
