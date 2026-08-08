import type { Metadata } from "next";
import Link from "next/link";
import { ClearHistoryButton } from "@/components/ClearHistoryButton";
import { TrackCard } from "@/components/TrackCard";
import { getFavoriteIds } from "@/lib/favorites";
import { getHistoryIds } from "@/lib/history";
import { getAllTracks } from "@/lib/store";
import type { Track } from "@/lib/types";

export const metadata: Metadata = {
  title: "History",
  description: "Tracks you recently played on Sharp Music.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [ids, catalog, favoriteIds] = await Promise.all([
    getHistoryIds(),
    getAllTracks(),
    getFavoriteIds(),
  ]);
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const tracks = ids
    .map((id) => byId.get(id))
    .filter((t): t is Track => Boolean(t));
  const favoriteSet = new Set(favoriteIds);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
            Recently played
          </h1>
          <p className="mt-3 text-[color:var(--mist)]">
            Saved on this device — newest first.
          </p>
        </div>
        {tracks.length > 0 ? <ClearHistoryButton /> : null}
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10">
          <p className="text-[color:var(--mist)]">
            Nothing played yet. Start a track and it will show up here.
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-block text-sm font-semibold text-[color:var(--signal)] hover:underline"
          >
            Browse the catalog →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-[color:var(--mist)]">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={tracks}
                favorited={favoriteSet.has(track.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
