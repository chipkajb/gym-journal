import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LayoutDashboard, BookOpen, PenLine, Calendar, Scale, BarChart3, Settings } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-lg text-gray-900 dark:text-white"
          >
            <span className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full">
              <Image
                src="/logo.png"
                alt=""
                fill
                className="object-cover"
              />
            </span>
            <span>Gym Journal</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </Link>
            <Link
              href="/workouts"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Log</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Link>
            <Link
              href="/metrics"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Metrics</span>
            </Link>
            <Link
              href="/analytics"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <span
              className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[140px] sm:max-w-[180px] truncate"
              title={fullEmail}
            >
              {label}
            </span>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
