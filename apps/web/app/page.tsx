import Image from 'next/image';
import Link from 'next/link';

/**
 * Splash screen / landing page
 * This is the first page users see when visiting the app.
 * Provides a clean entry point with the app logo and navigation to login/register.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <Image
              src="/logo.png"
              alt="Gym Journal Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Gym Journal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your fitness journey
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg shadow-md border border-gray-300 dark:border-gray-600 transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 dark:text-gray-400 pt-8">
          Your personal fitness companion
        </p>
      </div>
    </div>
  );
}

