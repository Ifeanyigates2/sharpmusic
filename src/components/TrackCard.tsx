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
    <article className="track-card group relative overflow-hidden rounded-md border border-white/8 bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--signal)]/40 hover:bg-white/[0.05]">
      <button
        type="button"
        onClick={() => playTrack(track)}
        className="relative block aspect-square w-full overflow-hidden"
        aria-label={`Play ${track.title}`}
      >
        <div className="absolute inset-0 transition duration-500 group-hover:scale-105">
          <CoverArt track={track} sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
        <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)] opacity-0 shadow-md transition group-hover:opacity-100">
          {active ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
        </span>
        <span className="absolute left-1.5 top-1.5 rounded-sm bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[color:var(--foam)] backdrop-blur">
          {track.pricing === "free" ? "Free" : formatPrice(track.priceCents)}
        </span>
      </button>

      <div className="space-y-1 p-2">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <Link
              href={`/track/${track.id}`}
              className="block truncate font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[color:var(--foam)] hover:text-[color:var(--signal)]"
            >
              {track.title}
            </Link>
            <p className="truncate text-[11px] text-[color:var(--mist)]">
              {track.artist}
            </p>
          </div>
          <Link
            href={`/track/${track.id}`}
            className="shrink-0 rounded-sm border border-white/15 p-1 text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
            aria-label={`Open ${track.title}`}
          >
            <Download size={12} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-[color:var(--mist)]">
          <span>{track.genre}</span>
          <span className="opacity-40">·</span>
          <span>{formatDuration(track.durationSec)}</span>
        </div>
      </div>
    </article>
  );
}
