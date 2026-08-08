import type { Metadata } from "next";
import { RequestPageClient } from "@/components/RequestPageClient";

export const metadata: Metadata = {
  title: "Find & Request",
  description:
    "Search the Sharp Music catalog and recommend songs you want us to add.",
};

export default function RequestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Find & Request
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Search what&apos;s already on Sharp Music, then recommend tracks you
          want added to the catalog.
        </p>
      </div>

      <RequestPageClient />
    </div>
  );
}
