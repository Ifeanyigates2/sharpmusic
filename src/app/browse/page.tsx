import { Suspense } from "react";
import type { Metadata } from "next";
import { BrowseFilters } from "@/components/BrowseFilters";
import { TrackCard } from "@/components/TrackCard";
import { searchTracks } from "@/lib/store";

export const metadata: Metadata = {
  title: "Browse",
  description: "Search and download free and paid music from artists worldwide.",
};

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
  const tracks = await searchTracks(params);

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
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
}
