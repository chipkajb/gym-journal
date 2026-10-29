import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="p-4 rounded-full bg-muted">
          <WifiOff className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          You&apos;re offline
        </h1>
        <p className="text-muted-foreground">
          This page isn&apos;t available without a connection. Check your network and try again.
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
