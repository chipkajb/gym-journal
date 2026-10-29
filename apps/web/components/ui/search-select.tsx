"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type SearchSelectOption = { value: string; label: string; hint?: string };

type Props = {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  /** Extra classes for the trigger button (width, etc.). */
  className?: string;
  /** Extra classes for the dropdown panel (defaults to trigger width). */
  menuClassName?: string;
};

/** Searchable single-select with keyboard support (↑/↓, Enter, Esc). */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search…",
  className = "w-full",
  menuClassName = "w-full",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function select(v: string) {
    onChange(v);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) select(opt.value);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className={`flex items-center justify-between gap-2 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-left text-sm ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-muted-foreground"}`}>
          {selected ? `${selected.label}${selected.hint ? ` (${selected.hint})` : ""}` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden ${menuClassName}`}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-controls={listId}
                aria-expanded
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => select(o.value)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    i === active ? "bg-accent" : ""
                  } ${o.value === value ? "text-primary font-medium" : "text-foreground"}`}
                >
                  <span className="block">{o.label}</span>
                  {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
