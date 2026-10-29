import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Splash screen / landing page
 * This is the first page users see when visiting the app.
 * Provides a clean entry point with the app logo and navigation to login/register.
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-full md:h-40 md:w-40">
            <Image
              src="/logo.png"
              alt="Gym Journal Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Gym Journal
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your fitness journey
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-card hover:bg-accent text-foreground font-semibold rounded-lg shadow-md border border-input transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground pt-8">
          Your personal fitness companion
        </p>
      </div>
    </div>
  );
}

