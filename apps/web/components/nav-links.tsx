"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  Lightbulb,
  Shuffle,
  TrendingUp,
  Trophy,
  Timer,
  Dumbbell,
  ChevronDown,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const trainingItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/wod", label: "WOD Picker", icon: Shuffle },
  { href: "/workouts", label: "Workouts", icon: PenLine },
  { href: "/library", label: "Library", icon: BookOpen },
];

const insightsItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/analytics", label: "Insights", icon: Lightbulb },
  { href: "/leaderboards", label: "Leaderboard", icon: Trophy },
];

const toolsItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/tools/1rm", label: "1RM estimate", icon: Dumbbell },
];

function NavDropdown({
  icon: TriggerIcon,
  menuLabel,
  items,
  pathname,
}: {
  icon: LucideIcon;
  menuLabel: string;
  items: { href: string; label: string; icon: LucideIcon }[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const path = pathname ?? "";
  const active = items.some(
    (item) => path === item.href || path.startsWith(item.href + "/")
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={menuLabel}
        title={menuLabel}
        className={`flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <TriggerIcon className="w-4 h-4 shrink-0" />
        <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {items.map(({ href, label: itemLabel, icon: Icon }) => {
            const isActive = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {itemLabel}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NavLinks() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex items-center gap-0.5 flex-wrap sm:flex-nowrap">
      {[{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }].map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
          </Link>
        );
      })}

      <NavDropdown
        icon={Dumbbell}
        menuLabel="Training menu"
        items={trainingItems}
        pathname={pathname}
      />
      <NavDropdown
        icon={TrendingUp}
        menuLabel="Stats and insights menu"
        items={insightsItems}
        pathname={pathname}
      />
      <NavDropdown
        icon={Wrench}
        menuLabel="Tools menu"
        items={toolsItems}
        pathname={pathname}
      />
    </nav>
  );
}
