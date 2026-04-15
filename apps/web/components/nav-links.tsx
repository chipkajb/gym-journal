"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Dumbbell, Wrench } from "lucide-react";

export function NavLinks() {
  const pathname = usePathname() ?? "";
  const analyticsActive = pathname === "/analytics" || pathname.startsWith("/analytics/");
  const trainingActive =
    pathname.startsWith("/training") ||
    pathname.startsWith("/workouts") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/wod");
  const toolsActive = pathname.startsWith("/tools") || pathname.startsWith("/timer");

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

      <Link
        href="/training"
        aria-label="Training"
        title="Training — WOD picker, workouts, library"
        className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          trainingActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <Dumbbell className="w-4 h-4 shrink-0" />
      </Link>

      <Link
        href="/analytics"
        aria-label="Stats"
        title="Stats"
        className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          analyticsActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <BarChart3 className="w-4 h-4 shrink-0" />
      </Link>

      <Link
        href="/tools"
        aria-label="Tools"
        title="Tools — timer and 1RM calculator"
        className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          toolsActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <Wrench className="w-4 h-4 shrink-0" />
      </Link>
    </nav>
  );
}
