"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Film,
  ListEnd,
  MoreVertical,
  Pause,
  Play,
} from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { FavoriteButton } from "@/components/FavoriteButton";
import { usePlayer } from "@/components/PlayerProvider";
import { formatDuration, formatPrice, artistPath } from "@/lib/format";
import type { Track } from "@/lib/types";

export function TrackCard({
  track,
  queue,
  favorited = false,
  showFavorite = true,
}: {
  track: Track;
  /** Catalog order used for autoplay / next-track streaming. */
  queue?: Track[];
  favorited?: boolean;
  showFavorite?: boolean;
}) {
  const { current, playing, playTrack, playAsNext, upNext } = usePlayer();
  const active = current?.id === track.id && playing;
  const isUpNext = upNext?.track.id === track.id && upNext.source === "user";
  const [menuOpen, setMenuOpen] = useState(false);
  const [queuedFlash, setQueuedFlash] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function queueAsNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    playAsNext(track);
    setMenuOpen(false);
    setQueuedFlash(true);
    window.setTimeout(() => setQueuedFlash(false), 1400);
  }

  return (
    <article className="track-card group relative">
      <button
        type="button"
        onClick={() => playTrack(track, queue)}
        className="relative block aspect-square w-full overflow-hidden rounded-sm bg-white/[0.03]"
        aria-label={`Play ${track.title}`}
      >
        <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]">
          <CoverArt
            track={track}
            sizes="(max-width:640px) 50vw, 200px"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm bg-[color:var(--signal)] text-[color:var(--ink)] opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100">
          {active ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
        </span>
        <span className="absolute left-2 top-2 flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)]">
            {track.pricing === "free" ? "Free" : formatPrice(track.priceCents)}
          </span>
          {track.videoUrl ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)]">
              <Film size={10} />
              Video
            </span>
          ) : null}
        </span>
        {isUpNext || queuedFlash ? (
          <span className="absolute bottom-2 left-2 rounded-sm bg-[color:var(--signal)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--ink)]">
            Up next
          </span>
        ) : null}
      </button>

      {showFavorite ? (
        <div className="absolute right-1.5 top-1.5 z-10 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
          <FavoriteButton
            trackId={track.id}
            initiallyFavorited={favorited}
            size="sm"
          />
        </div>
      ) : null}

      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <Link
              href={`/track/${track.id}`}
              className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-[color:var(--foam)] hover:text-[color:var(--signal)]"
            >
              {track.title}
            </Link>
            <Link
              href={artistPath(track.artist)}
              className="block truncate text-xs text-[color:var(--mist)] hover:text-[color:var(--signal)]"
            >
              {track.artist}
            </Link>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded-sm p-1 text-[color:var(--mist)] transition hover:bg-white/10 hover:text-[color:var(--foam)]"
              aria-label={`More options for ${track.title}`}
              aria-expanded={menuOpen}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-md border border-white/10 bg-[color:var(--ink)] shadow-xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playTrack(track, queue);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[color:var(--foam)] hover:bg-white/[0.06]"
                >
                  <Play size={12} />
                  Play now
                </button>
                <button
                  type="button"
                  onClick={queueAsNext}
                  disabled={current?.id === track.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[color:var(--foam)] hover:bg-white/[0.06] disabled:opacity-40"
                >
                  {queuedFlash || isUpNext ? (
                    <Check size={12} className="text-[color:var(--signal)]" />
                  ) : (
                    <ListEnd size={12} />
                  )}
                  Play next
                </button>
                <Link
                  href={`/track/${track.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[color:var(--foam)] hover:bg-white/[0.06]"
                >
                  <Download size={12} />
                  Open track
                </Link>
                {track.videoUrl ? (
                  <Link
                    href={`/track/${track.id}#video`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[color:var(--foam)] hover:bg-white/[0.06]"
                  >
                    <Film size={12} />
                    Watch video
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
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
