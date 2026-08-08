import type { Metadata } from "next";
import Link from "next/link";
import { ChartsList } from "@/components/ChartsList";
import { getWeeklyCharts } from "@/lib/charts";

export const metadata: Metadata = {
  title: "Charts",
  description: "This week’s most downloaded tracks on Sharp Music.",
};

export const dynamic = "force-dynamic";

export default async function ChartsPage() {
  const { entries, source, since } = await getWeeklyCharts(25);
  const sinceLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(since));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Charts
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          {source === "week"
            ? `Most downloaded since ${sinceLabel} (week to date).`
            : "Most popular in the catalog — weekly rankings appear as people download."}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-[color:var(--mist)]">
          No chart data yet.{" "}
          <Link
            href="/browse"
            className="font-semibold text-[color:var(--signal)] hover:underline"
          >
            Browse and download
          </Link>{" "}
          to get rankings started.
        </p>
      ) : (
        <ChartsList entries={entries} source={source} />
      )}
    </div>
  );
}
