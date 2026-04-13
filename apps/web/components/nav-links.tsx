"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  BarChart3,
  Shuffle,
  Trophy,
  Timer,
  Dumbbell,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

const trainingItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/workouts", label: "Workouts", icon: PenLine },
  { href: "/library", label: "Library", icon: BookOpen },
];

const insightsItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/leaderboards", label: "Leaderboard", icon: Trophy },
];

const toolsItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/tools/1rm", label: "1RM estimate", icon: Dumbbell },
];

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
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
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform sm:ml-0.5 ${open ? "rotate-180" : ""}`} />
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
      {[
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/wod", label: "WOD", icon: Shuffle },
      ].map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}

      <NavDropdown label="Training" items={trainingItems} pathname={pathname} />
      <NavDropdown label="Stats" items={insightsItems} pathname={pathname} />
      <NavDropdown label="Tools" items={toolsItems} pathname={pathname} />
    </nav>
  );
}
