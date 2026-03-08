import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="p-4 rounded-full bg-gray-200 dark:bg-gray-700">
          <WifiOff className="w-12 h-12 text-gray-600 dark:text-gray-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          You&apos;re offline
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This page isn&apos;t available without a connection. Check your network and try again.
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
