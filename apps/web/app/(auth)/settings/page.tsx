"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { setThemeCookie } from "@/lib/theme";
import { useTheme } from "@/components/providers/theme-provider";
import { Settings as SettingsIcon } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        Preferences
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h2>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your name"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used in the header and as “Welcome back, [first name]” on the dashboard.
            </p>
          </div>
          {data?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-700 dark:text-gray-300">{data.email}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => handleDarkModeChange(!darkMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                darkMode ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
