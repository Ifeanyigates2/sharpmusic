"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { PlayAllButton } from "@/components/PlayAllButton";
import { usePlayer } from "@/components/PlayerProvider";
import { artistPath, formatDownloads } from "@/lib/format";
import type { Track } from "@/lib/types";

type ChartRow = {
  rank: number;
  track: Track;
  downloads: number;
};

export function ChartsList({
  entries,
  source,
}: {
  entries: ChartRow[];
  source: "week" | "all-time";
}) {
  const { current, playing, playTrack } = usePlayer();
  const tracks = entries.map((e) => e.track);

  return (
    <div>
      <div className="mb-6">
        <PlayAllButton tracks={tracks} label="Play charts" />
      </div>
      <ol className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        {entries.map(({ rank, track, downloads }) => {
          const active = current?.id === track.id && playing;
          return (
            <li
              key={track.id}
              className="flex items-center gap-3 px-3 py-3 transition hover:bg-white/[0.04] sm:gap-5 sm:px-5"
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
              <button
                type="button"
                onClick={() => playTrack(track, tracks)}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm sm:h-14 sm:w-14"
                aria-label={active ? `Pause ${track.title}` : `Play ${track.title}`}
              >
                <CoverArt track={track} sizes="56px" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[color:var(--signal)] text-[color:var(--ink)]">
                    {active ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                  </span>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/track/${track.id}`}
                  className="block truncate font-[family-name:var(--font-display)] font-semibold text-[color:var(--foam)] hover:text-[color:var(--signal)]"
                >
                  {track.title}
                </Link>
                <p className="truncate text-sm text-[color:var(--mist)]">
                  <Link
                    href={artistPath(track.artist)}
                    className="hover:text-[color:var(--signal)]"
                  >
                    {track.artist}
                  </Link>
                  {" · "}
                  {track.genre}
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
