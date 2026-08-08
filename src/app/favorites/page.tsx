import type { Metadata } from "next";
import Link from "next/link";
import { PlayAllButton } from "@/components/PlayAllButton";
import { TrackCard } from "@/components/TrackCard";
import { getFavoriteIds } from "@/lib/favorites";
import { getAllTracks } from "@/lib/store";
import type { Track } from "@/lib/types";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Tracks you saved on Sharp Music.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const [ids, catalog] = await Promise.all([getFavoriteIds(), getAllTracks()]);
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const tracks = ids
    .map((id) => byId.get(id))
    .filter((t): t is Track => Boolean(t));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Favorites
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Saved on this device — play, download, or remove anytime.
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10">
          <p className="text-[color:var(--mist)]">
            No favorites yet. Tap the heart on a track to keep it here.
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
          <div className="flex flex-wrap items-center gap-4">
            <PlayAllButton tracks={tracks} />
            <p className="text-sm text-[color:var(--mist)]">
              {tracks.length} saved track{tracks.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={tracks}
                favorited
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
