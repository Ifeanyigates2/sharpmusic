"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayer } from "@/components/PlayerProvider";
import { formatDuration } from "@/lib/format";

export function AudioPlayer() {
  const { current, playing, progress, duration, toggle, seek } = usePlayer();

  if (!current) return null;

  const ratio = duration ? progress / duration : 0;

  return (
    <div className="player-bar fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[color:var(--ink)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
          <CoverArt track={current} sizes="48px" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/track/${current.id}`}
            className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-[color:var(--foam)] hover:text-[color:var(--signal)]"
          >
            {current.title}
          </Link>
          <p className="truncate text-xs text-[color:var(--mist)]">
            {current.artist} · {current.country}
          </p>
          <button
            type="button"
            className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/10"
            aria-label="Seek"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <span
              className="block h-full rounded-full bg-[color:var(--signal)] transition-[width] duration-150"
              style={{ width: `${ratio * 100}%` }}
            />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs tabular-nums text-[color:var(--mist)] sm:inline">
            {formatDuration(progress)} / {formatDuration(duration || current.durationSec)}
          </span>
          <button
            type="button"
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)] transition hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
        </div>
      </div>
    </div>
  );
}
