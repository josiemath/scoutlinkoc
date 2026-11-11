import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/misc";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PRIMARY_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground",
    isActive ? "text-primary" : "text-muted-foreground"
  );

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-12 items-center rounded-lg px-3 text-base font-semibold transition-colors hover:bg-accent",
    isActive ? "bg-secondary text-secondary-foreground" : "text-foreground"
  );

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="rounded-md" aria-label="ScoutLink OC, home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <NavLink to={item.href} className={desktopLink}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/signup">Request access</Link>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <MenuIcon className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                  <Wordmark />
                </SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="px-3">
                <ul className="grid gap-1">
                  <li>
                    <SheetClose asChild>
                      <NavLink to="/" end className={mobileLink}>
                        Home
                      </NavLink>
                    </SheetClose>
                  </li>
                  {PRIMARY_NAV.map((item) => (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <NavLink to={item.href} className={mobileLink}>
                          {item.label}
                        </NavLink>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <Separator className="mx-4 w-auto" />
              <div className="grid gap-2 px-4">
                <SheetClose asChild>
                  <Button asChild size="lg">
                    <Link to="/signup">Request access</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/login">Sign in</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
