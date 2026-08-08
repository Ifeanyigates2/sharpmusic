import type { Metadata } from "next";
import Link from "next/link";
import { MusicVideoCard } from "@/components/MusicVideoCard";
import { getTracksWithVideos } from "@/lib/store";

export const metadata: Metadata = {
  title: "Music videos",
  description: "Watch music videos on Sharp Music.",
};

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const tracks = await getTracksWithVideos();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
            Music videos
          </h1>
          <p className="mt-3 text-[color:var(--mist)]">
            Official videos for tracks in the catalog — tap a cover to watch.
          </p>
        </div>
        <Link
          href="/lifestyle"
          className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
        >
          Lifestyle videos →
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10">
          <p className="text-[color:var(--mist)]">
            No music videos yet. When admins attach a video to a track, it will
            show up here.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/browse"
              className="text-sm font-semibold text-[color:var(--signal)] hover:underline"
            >
              Browse the catalog →
            </Link>
            <Link
              href="/lifestyle"
              className="text-sm font-semibold text-[color:var(--signal)] hover:underline"
            >
              Lifestyle videos →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-[color:var(--mist)]">
            {tracks.length} video{tracks.length === 1 ? "" : "s"}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tracks.map((track) => (
              <MusicVideoCard key={track.id} track={track} queue={tracks} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
