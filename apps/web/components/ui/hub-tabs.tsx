"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type HubTab<T extends string> = { id: T; label: string; icon: LucideIcon };

/**
 * Reads a tab id from the query string and returns a setter that replaces it in place.
 * The first tab is the default and is kept out of the URL.
 */
export function useTabParam<T extends string>(param: string, tabs: readonly HubTab<T>[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fallback = tabs[0]!.id;
  const raw = searchParams.get(param);
  const active = (tabs.some((t) => t.id === raw) ? raw : fallback) as T;

  const setActive = useCallback(
    (next: T) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === fallback) qs.delete(param);
      else qs.set(param, next);
      const tail = qs.toString();
      router.replace(tail ? `${pathname}?${tail}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, param, fallback]
  );

  return [active, setActive] as const;
}

/** Page title plus a segmented tab control (←/→/Home/End move between tabs). */
export function HubHeader<T extends string>({
  title,
  label,
  idPrefix,
  tabs,
  active,
  onSelect,
}: {
  title: string;
  label: string;
  idPrefix: string;
  tabs: readonly HubTab<T>[];
  active: T;
  onSelect: (id: T) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active);
    const next =
      e.key === "ArrowRight" ? (i + 1) % tabs.length
      : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0
      : e.key === "End" ? tabs.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(tabs[next]!.id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="grid gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ id, label: tabLabel, icon: Icon }) => (
          <button
            key={id}
            id={`${idPrefix}-${id}`}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => onSelect(id)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              active === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {tabLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
