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
      className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
      aria-label="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
