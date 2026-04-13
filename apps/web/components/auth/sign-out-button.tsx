"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  function onSignOut() {
    if (!window.confirm("Sign out of Gym Journal?")) return;
    void signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
