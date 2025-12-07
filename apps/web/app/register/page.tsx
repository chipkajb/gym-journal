import Image from 'next/image';
import Link from 'next/link';

/**
 * Registration page
 * Simple registration interface with email/password fields.
 * For now, this is a placeholder UI - authentication will be added later.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <Image
                src="/logo.png"
                alt="Gym Journal Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create an account
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Start tracking your fitness journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          <form className="space-y-4">
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
                name="name"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
            >
              Create Account
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

