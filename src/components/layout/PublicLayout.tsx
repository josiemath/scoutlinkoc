import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigation } from "react-router";
import { config } from "@/lib/env";
import { PageSkeleton } from "./PageSkeleton";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Moves focus to the main region after client-side navigation so screen readers announce the new page. */
function useFocusMainOnNavigate(mainRef: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, mainRef]);
}

/** The site frame: skip link, independence notice, header, main region and footer. */
function SiteFrame({ mainRef, children }: { mainRef: RefObject<HTMLElement | null>; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {config.authorizationReference === null && (
        <p className="bg-brand-dark px-4 py-2 text-center text-xs font-medium text-brand-dark-foreground sm:text-sm">
          Independent demonstration with fictional data. Not an official Girl Scouts of Orange County service.
        </p>
      )}

      <SiteHeader />

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export function PublicLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const navigation = useNavigation();
  useFocusMainOnNavigate(mainRef);

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary transition-transform duration-500 ${navigation.state === "loading" ? "scale-x-75" : "scale-x-0"}`}
      />
      <SiteFrame mainRef={mainRef}>
        <Outlet />
      </SiteFrame>
      <ScrollRestoration />
    </>
  );
}

/** Shown while the first page's code downloads, so the frame doesn't jump when it arrives. */
export function PublicLayoutFallback() {
  const mainRef = useRef<HTMLElement>(null);
  return (
    <SiteFrame mainRef={mainRef}>
      <PageSkeleton />
    </SiteFrame>
  );
}
