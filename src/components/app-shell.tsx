import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Activity,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth-context";

type NavKey = "home" | "training" | "health" | "admin" | "changelog";

const NAV_ITEMS: Array<{
  key: NavKey;
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "home", to: "/", label: "Overview", icon: LayoutDashboard },
  { key: "admin", to: "/admin", label: "Admin", icon: Settings },
  { key: "training", to: "/training", label: "Training", icon: Dumbbell },
  { key: "health", to: "/health", label: "Health", icon: Activity },
  { key: "changelog", to: "/changelog", label: "Changelog", icon: History },
];

// VSCode-style shell: a persistent icon+label rail on the left picks which
// section is open on the right, instead of every page being its own
// full-screen view with a back arrow. Sections stay mounted as ordinary
// router pages (Link does a client-side nav, no full reload) — this is
// purely the surrounding chrome. Below the sm breakpoint there's no room
// for a persistent rail, so it's replaced by a top bar + slide-in drawer.
export function AppShell({
  active,
  title,
  description,
  children,
}: {
  active: NavKey;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  // The drawer's trigger is only reachable below sm, but guard against a
  // resize (e.g. rotating a tablet) leaving it open once the rail takes over.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const close = () => setNavOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  const navList = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-0.5 px-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition ${
              isActive
                ? "border-l-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] text-foreground"
                : "border-l-transparent text-sidebar-foreground hover:bg-[var(--sidebar-hover-bg)] hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 sm:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.svg"
            alt="Housekeeping"
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            Housekeeping
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-sidebar-foreground transition hover:bg-[var(--sidebar-hover-bg)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <DialogPrimitive.Root open={navOpen} onOpenChange={setNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:hidden" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-sidebar-border bg-sidebar duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:hidden"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">
              Navigation
            </DialogPrimitive.Title>
            <div className="flex items-center justify-between px-3 py-4">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                Housekeeping
              </span>
              <DialogPrimitive.Close
                aria-label="Close menu"
                className="rounded-md p-1.5 text-sidebar-foreground transition hover:bg-[var(--sidebar-hover-bg)]"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            {navList(() => setNavOpen(false))}
            <div className="border-t border-sidebar-border px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:flex">
        <Link to="/" className="flex items-center gap-2.5 px-4 py-4">
          <img
            src="/logo.svg"
            alt="Housekeeping"
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            Housekeeping
          </span>
        </Link>

        {navList()}

        <div className="border-t border-sidebar-border px-2 py-2">
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Log out</span>
          </button>
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-12">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </header>
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
