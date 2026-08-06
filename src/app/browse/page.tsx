import { Suspense } from "react";
import type { Metadata } from "next";
import { BrowseFilters } from "@/components/BrowseFilters";
import { TrackCard } from "@/components/TrackCard";
import { getAllTracks, searchTracks } from "@/lib/store";

export const metadata: Metadata = {
  title: "Browse",
  description: "Search and download free and paid music from artists worldwide.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    region?: string;
    pricing?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const hasFilters = Boolean(
    params.q?.trim() || params.genre || params.region || params.pricing,
  );
  // Same catalog order as homepage when no filters are applied
  const tracks = hasFilters
    ? await searchTracks(params)
    : await getAllTracks();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Browse
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Filter by genre, region, or price — then preview and download.
        </p>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-white/5" />}>
        <BrowseFilters />
      </Suspense>

      <p className="mt-6 text-sm text-[color:var(--mist)]">
        {tracks.length} track{tracks.length === 1 ? "" : "s"}
      </p>

      {tracks.length === 0 ? (
        <p className="mt-10 text-[color:var(--mist)]">
          No tracks match those filters. Try clearing search or picking another region.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
}
