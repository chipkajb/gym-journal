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
} from "lucide-react";

// Primary nav items always visible
const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wod", label: "WOD", icon: Shuffle },
  { href: "/workouts", label: "Workouts", icon: PenLine },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

// Secondary nav items in "More" dropdown
const secondaryNav = [
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/leaderboards", label: "Leaderboard", icon: Trophy },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/tools/1rm", label: "1RM Calc", icon: Dumbbell },
];

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSecondaryActive = secondaryNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="flex items-center gap-0.5">
      {primaryNav.map(({ href, label, icon: Icon }) => {
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

      {/* More dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            isSecondaryActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <span className="hidden sm:inline">More</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
            {secondaryNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
