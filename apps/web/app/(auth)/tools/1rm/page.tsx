import { OneRepMaxClient } from "./one-rep-max-client";

export default function OneRepMaxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">1-Rep Max Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estimate your max lift from any sub-maximal effort using Epley&apos;s formula.
        </p>
      </div>
      <OneRepMaxClient />
    </div>
  );
}
