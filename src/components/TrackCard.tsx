"use client";

import Link from "next/link";
import { Download, Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayer } from "@/components/PlayerProvider";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Track } from "@/lib/types";

export function TrackCard({ track }: { track: Track }) {
  const { current, playing, playTrack } = usePlayer();
  const active = current?.id === track.id && playing;

  return (
    <article className="track-card group relative">
      <button
        type="button"
        onClick={() => playTrack(track)}
        className="relative block aspect-square w-full overflow-hidden rounded-sm bg-white/[0.03]"
        aria-label={`Play ${track.title}`}
      >
        <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]">
          <CoverArt
            track={track}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm bg-[color:var(--signal)] text-[color:var(--ink)] opacity-0 transition group-hover:opacity-100">
          {active ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
        </span>
        <span className="absolute left-2 top-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)]">
          {track.pricing === "free" ? "Free" : formatPrice(track.priceCents)}
        </span>
      </button>

      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/track/${track.id}`}
              className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-[color:var(--foam)] hover:text-[color:var(--signal)]"
            >
              {track.title}
            </Link>
            <p className="truncate text-xs text-[color:var(--mist)]">
              {track.artist}
            </p>
          </div>
          <Link
            href={`/track/${track.id}`}
            className="mt-0.5 shrink-0 text-[color:var(--mist)] transition hover:text-[color:var(--signal)]"
            aria-label={`Open ${track.title}`}
          >
            <Download size={14} />
          </Link>
        </div>
        <p className="text-[11px] text-[color:var(--mist)]/80">
          {track.genre}
          <span className="mx-1 opacity-40">·</span>
          {formatDuration(track.durationSec)}
        </p>
      </div>
    </article>
  );
}
