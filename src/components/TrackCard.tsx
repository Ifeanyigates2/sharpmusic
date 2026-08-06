"use client";

import Link from "next/link";
import { Download, Pause, Play } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import {
  coverGradient,
  formatDownloads,
  formatDuration,
  formatPrice,
} from "@/lib/format";
import type { Track } from "@/lib/types";

export function TrackCard({ track }: { track: Track }) {
  const { current, playing, playTrack } = usePlayer();
  const active = current?.id === track.id && playing;

  return (
    <article className="track-card group relative overflow-hidden rounded-lg border border-white/8 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-[color:var(--signal)]/40 hover:bg-white/[0.05]">
      <button
        type="button"
        onClick={() => playTrack(track)}
        className="relative block aspect-square w-full overflow-hidden"
        aria-label={`Play ${track.title}`}
      >
        <div
          className="absolute inset-0 transition duration-500 group-hover:scale-105"
          style={{ background: coverGradient(track.coverHue) }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)] opacity-0 shadow-lg transition group-hover:opacity-100">
          {active ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </span>
        <span className="absolute left-3 top-3 rounded-sm bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)] backdrop-blur">
          {track.pricing === "free" ? "Free" : formatPrice(track.priceCents)}
        </span>
      </button>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/track/${track.id}`}
              className="block truncate font-[family-name:var(--font-display)] text-base font-semibold tracking-wide text-[color:var(--foam)] hover:text-[color:var(--signal)]"
            >
              {track.title}
            </Link>
            <p className="truncate text-sm text-[color:var(--mist)]">
              {track.artist}
            </p>
          </div>
          <Link
            href={`/track/${track.id}`}
            className="shrink-0 rounded-sm border border-white/15 p-2 text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
            aria-label={`Open ${track.title}`}
          >
            <Download size={16} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--mist)]">
          <span>{track.genre}</span>
          <span className="opacity-40">·</span>
          <span>{track.country}</span>
          <span className="opacity-40">·</span>
          <span>{formatDuration(track.durationSec)}</span>
          <span className="opacity-40">·</span>
          <span>{formatDownloads(track.downloads)} downloads</span>
        </div>
      </div>
    </article>
  );
}
