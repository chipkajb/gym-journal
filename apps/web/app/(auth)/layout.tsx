import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLinks } from "@/components/nav-links";
import { Settings } from "lucide-react";

function displayName(session: { user?: { name?: string | null; email?: string | null } | null }) {
  const name = session.user?.name?.trim();
  if (name) return name;
  const email = session.user?.email ?? "";
  const local = email.split("@")[0];
  return local || "Account";
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const label = displayName(session);
  const fullEmail = session.user?.email ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg shrink-0"
          >
            <span className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
              <Image
                src="/logo.png"
                alt=""
                fill
                className="object-contain p-0.5"
              />
            </span>
            <span className="hidden sm:inline text-foreground">Gym Journal</span>
          </Link>

          <NavLinks />

          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-sm font-medium text-muted-foreground max-w-[100px] truncate hidden sm:block"
              title={fullEmail}
            >
              {label}
            </span>
            <Link
              href="/settings"
              className="flex items-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
