"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { setThemeCookie } from "@/lib/theme";
import { useTheme } from "@/components/providers/theme-provider";
import { Settings as SettingsIcon, Download, Smartphone } from "lucide-react";

type ProfileData = {
  name: string;
  email: string;
  darkModeEnabled: boolean;
  preferredUnit: string;
  weekStartsOn: number;
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { setTheme } = useTheme();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      setData(json);
      setName(json.name ?? "");
      const dark = json.darkModeEnabled ?? false;
      setDarkMode(dark);
      // sync saved preference to cookie/dom so theme matches
      setThemeCookie(dark ? "dark" : "light");
      setTheme(dark ? "dark" : "light");
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, darkModeEnabled: darkMode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.name?.[0] ?? json.error ?? "Failed to save.");
        return;
      }
      setThemeCookie(darkMode ? "dark" : "light");
      setTheme(darkMode ? "dark" : "light");
      await updateSession({ ...session, user: { ...session?.user, name: name.trim() || null } });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDarkModeChange(next: boolean) {
    setDarkMode(next);
    setThemeCookie(next ? "dark" : "light");
    setTheme(next ? "dark" : "light");
    // persist to backend without full save (optional: debounced save)
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkModeEnabled: next }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        Preferences
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            Profile
          </h2>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
              placeholder="Your name"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used in the header and as “Welcome back, [first name]” on the dashboard.
            </p>
          </div>
          {data?.email && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <p className="text-sm text-foreground">{data.email}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Appearance
          </h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium text-foreground">
              Dark mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => handleDarkModeChange(!darkMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                darkMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  darkMode ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-lg"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Data Export */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export your data
        </h2>
        <p className="text-sm text-muted-foreground">
          Download all your workout logs as CSV or JSON.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export?format=csv"
            download="workouts.csv"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-input text-foreground hover:bg-accent"
          >
            Workouts CSV
          </a>
          <a
            href="/api/export?format=json"
            download="gym-journal-export.json"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white"
          >
            Full export (JSON)
          </a>
        </div>
      </div>

      {/* Device Integrations shortcut */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device integrations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect Apple Health, Google Fit, Fitbit, and Garmin to sync your activity data.
            </p>
          </div>
          <Link
            href="/settings/integrations"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-input text-foreground hover:bg-accent shrink-0"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
