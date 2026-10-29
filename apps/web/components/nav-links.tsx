"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Dumbbell, Wrench, Plus, type LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should highlight this item. */
  match: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/training", label: "Training", icon: Dumbbell, match: ["/training", "/workouts", "/library", "/wod", "/history"] },
  { href: "/analytics", label: "Stats", icon: BarChart3, match: ["/analytics", "/leaderboards"] },
  { href: "/tools", label: "Tools", icon: Wrench, match: ["/tools", "/timer"] },
];

function useActive() {
  const pathname = usePathname() ?? "";
  return (item: NavItem) =>
    item.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Desktop / tablet navigation inside the header. */
export function NavLinks() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom tab bar with a prominent "Log" action in the middle. */
export function MobileTabBar() {
  const isActive = useActive();
  const tab = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <item.icon className="w-5 h-5" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md items-center">
        {NAV_ITEMS.slice(0, 2).map(tab)}
        <Link
          href="/workouts/new"
          aria-label="Log workout"
          className="-mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>
        {NAV_ITEMS.slice(2).map(tab)}
      </div>
    </nav>
  );
}
