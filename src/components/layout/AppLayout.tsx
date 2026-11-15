import {
  BadgeCheckIcon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UserRoundIcon
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, Navigate, NavLink, Outlet, ScrollRestoration, useLocation, useMatches, useNavigate } from "react-router";
import { toast } from "sonner";
import { AccountsClosedNotice } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@/components/ui/misc";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAccount } from "@/hooks/use-account";
import type { AppOutletContext, AppRouteHandle, RouteAccess } from "@/hooks/use-app-account";
import { useAuth } from "@/hooks/use-auth";
import { displayNameOf, isAdmin, type Account } from "@/lib/account";
import { config } from "@/lib/env";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface NavEntry {
  label: string;
  href: string;
  Icon: typeof LayoutDashboardIcon;
}

function navFor(account: Account | undefined): NavEntry[] {
  const items: NavEntry[] = [{ label: "Dashboard", href: "/dashboard", Icon: LayoutDashboardIcon }];
  if (account && (account.account_state === "pending_verification" || account.account_state === "active")) {
    items.push({ label: "Verification", href: "/onboarding", Icon: BadgeCheckIcon });
    items.push({ label: "Profile", href: "/profile", Icon: UserRoundIcon });
  }
  items.push({ label: "Settings", href: "/settings", Icon: SettingsIcon });
  if (isAdmin(account)) items.push({ label: "Verification requests", href: "/admin/verifications", Icon: ClipboardCheckIcon });
  return items;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-[1.125rem]",
    isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
  );

function useRouteAccess(): RouteAccess {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const access = (matches[i]?.handle as AppRouteHandle | undefined)?.access;
    if (access) return access;
  }
  return "member";
}

/**
 * Layout for signed-in pages. Sends signed-out visitors to sign in, loads the
 * account, and only shows pages the account's verified roles allow. These
 * checks shape the interface; Row Level Security enforces the same rules on
 * every request.
 */
export function AppLayout() {
  const { status } = useAuth();
  const location = useLocation();
  const access = useRouteAccess();
  const accountQuery = useAccount();
  const account = accountQuery.data;

  if (status === "unconfigured") {
    return (
      <AppFrame>
        <div className="max-w-xl">
          <AccountsClosedNotice />
          <Link to="/" className="font-semibold text-primary underline underline-offset-4">
            Back to the home page
          </Link>
        </div>
      </AppFrame>
    );
  }

  if (status === "signed_out") {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (status === "loading" || accountQuery.isPending) {
    return (
      <AppFrame>
        <div role="status" aria-label="Loading your account" className="grid max-w-3xl gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="mt-4 h-40" />
        </div>
      </AppFrame>
    );
  }

  if (accountQuery.isError || !account) {
    return (
      <AppFrame>
        <AccountLoadError error={accountQuery.error} onRetry={() => void accountQuery.refetch()} />
      </AppFrame>
    );
  }

  const editable = account.account_state === "pending_verification" || account.account_state === "active";
  if (access === "editable" && !editable) return <Navigate to="/dashboard" replace />;

  const context: AppOutletContext = { account };
  return (
    <AppFrame account={account}>
      {access === "admin" && !isAdmin(account) ? <NotPermitted /> : <Outlet context={context} />}
    </AppFrame>
  );
}

function AccountLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { signOut } = useAuth();
  return (
    <Alert variant="destructive" className="max-w-xl">
      <ShieldAlertIcon aria-hidden="true" />
      <AlertTitle>Couldn't load your account</AlertTitle>
      <AlertDescription>
        <p>{friendlyError(error)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onRetry}>
            <RefreshCwIcon aria-hidden="true" />
            Try again
          </Button>
          <Button size="sm" variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function NotPermitted() {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold">You can't open this page</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        This page is for verified council administrators. If you think you should have access, ask a platform
        administrator to check your role.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Go to your dashboard</Link>
      </Button>
    </div>
  );
}

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

function AppFrame({ account, children }: { account?: Account; children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useFocusMainOnNavigate(mainRef);
  const nav = navFor(account);

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

      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {account && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <MenuIcon className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>
                    <Wordmark />
                  </SheetTitle>
                  <SheetDescription className="sr-only">Account navigation</SheetDescription>
                </SheetHeader>
                <nav aria-label="Account" className="px-3">
                  <ul className="grid gap-1">
                    {nav.map(({ label, href, Icon }) => (
                      <li key={href}>
                        <SheetClose asChild>
                          <NavLink to={href} className={navLinkClass}>
                            <Icon aria-hidden="true" />
                            {label}
                          </NavLink>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <Link to={account ? "/dashboard" : "/"} className="rounded-md" aria-label={account ? "ScoutLink OC, dashboard" : "ScoutLink OC, home"}>
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {account && <UserMenu account={account} />}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {account && (
          <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block">
            <nav aria-label="Account" className="sticky top-16 p-4">
              <ul className="grid gap-1">
                {nav.map(({ label, href, Icon }) => (
                  <li key={href}>
                    <NavLink to={href} className={navLinkClass}>
                      <Icon aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 outline-none sm:px-6 md:py-10 lg:px-10">
          {children}
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}

function UserMenu({ account }: { account: Account }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const name = displayNameOf(account);
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      // Leave the signed-in area first (flushSync commits it now), so this layout
      // doesn't treat the ended session as expired and redirect to sign-in.
      await navigate("/", { replace: true, flushSync: true });
      await signOut();
      toast.success("You're signed out.");
    } catch (error) {
      toast.error(friendlyError(error));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="sr-only">Account menu for </span>
          <span className="sr-only max-w-40 truncate sm:not-sr-only">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate text-sm text-foreground">{name}</span>
          <span className="truncate font-normal">{account.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(account.account_state === "pending_verification" || account.account_state === "active") && (
          <DropdownMenuItem onSelect={() => navigate("/profile")}>
            <UserRoundIcon aria-hidden="true" />
            Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <SettingsIcon aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
