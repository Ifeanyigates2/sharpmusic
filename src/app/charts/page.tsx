import type { Metadata } from "next";
import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { getWeeklyCharts } from "@/lib/charts";
import { formatDownloads } from "@/lib/format";

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
        <ol className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
          {entries.map(({ rank, track, downloads }) => (
            <li key={track.id}>
              <Link
                href={`/track/${track.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.04] sm:gap-5 sm:px-5"
              >
                <span
                  className={`w-7 shrink-0 text-center font-[family-name:var(--font-display)] text-lg font-bold tabular-nums ${
                    rank <= 3
                      ? "text-[color:var(--signal)]"
                      : "text-[color:var(--mist)]"
                  }`}
                >
                  {rank}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm sm:h-14 sm:w-14">
                  <CoverArt track={track} sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] font-semibold text-[color:var(--foam)]">
                    {track.title}
                  </p>
                  <p className="truncate text-sm text-[color:var(--mist)]">
                    {track.artist} · {track.genre}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-[color:var(--foam)]">
                    {formatDownloads(downloads)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[color:var(--mist)]">
                    {source === "week" ? "This week" : "All time"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
