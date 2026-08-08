import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaylistTrackActions } from "@/components/PlaylistTrackActions";
import { TrackCard } from "@/components/TrackCard";
import { getFavoriteIds } from "@/lib/favorites";
import { getPlaylistById } from "@/lib/playlists-server";
import { getAllTracks } from "@/lib/store";
import type { Track } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const playlist = await getPlaylistById(id);
  if (!playlist) return { title: "Playlist" };
  return {
    title: playlist.name,
    robots: { index: false },
  };
}

export default async function PlaylistDetailPage({ params }: Props) {
  const { id } = await params;
  const playlist = await getPlaylistById(id);
  if (!playlist) notFound();

  const [catalog, favoriteIds] = await Promise.all([
    getAllTracks(),
    getFavoriteIds(),
  ]);
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const tracks = playlist.trackIds
    .map((trackId) => byId.get(trackId))
    .filter((t): t is Track => Boolean(t));
  const favoriteSet = new Set(favoriteIds);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <p className="text-sm text-[color:var(--mist)]">
        <Link href="/playlists" className="hover:text-[color:var(--signal)]">
          ← Playlists
        </Link>
      </p>
      <div className="mt-4 mb-8 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          {playlist.name}
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          {tracks.length} track{tracks.length === 1 ? "" : "s"} on this device
        </p>
      </div>

      {tracks.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10 text-[color:var(--mist)]">
          This playlist is empty. Open a track and use{" "}
          <span className="text-[color:var(--foam)]">Add to playlist</span>.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tracks.map((track) => (
            <div key={track.id} className="relative">
              <TrackCard
                track={track}
                queue={tracks}
                favorited={favoriteSet.has(track.id)}
              />
              <div className="mt-2">
                <PlaylistTrackActions
                  playlistId={playlist.id}
                  trackId={track.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
