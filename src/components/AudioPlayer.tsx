"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayer } from "@/components/PlayerProvider";
import { formatDuration } from "@/lib/format";

export function AudioPlayer() {
  const {
    current,
    playing,
    progress,
    duration,
    nextReason,
    nextSource,
    toggle,
    seek,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
  } = usePlayer();

  const total = duration || current?.durationSec || 0;
  const liveRatio = total > 0 ? Math.min(progress / total, 1) : 0;
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);

  useEffect(() => {
    if (!scrubbing) setScrubRatio(liveRatio);
  }, [liveRatio, scrubbing]);

  if (!current) return null;

  const ratio = scrubbing ? scrubRatio : liveRatio;
  const displayTime = scrubbing ? scrubRatio * total : progress;

  function seekFromClientX(el: HTMLElement, clientX: number) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setScrubRatio(next);
    seek(next);
  }

  return (
    <div className="player-bar fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[color:var(--ink)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
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
          {nextReason && (
            <p className="mt-0.5 truncate text-[10px] text-[color:var(--signal)]/80">
              {nextSource === "gemini" ? "Gemini" : "Auto"} · {nextReason}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-[color:var(--mist)] sm:w-10 sm:text-xs">
              {formatDuration(displayTime)}
            </span>
            <div
              className="group relative flex h-5 flex-1 cursor-pointer touch-none items-center"
              role="slider"
              tabIndex={0}
              aria-label="Seek through track"
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(displayTime)}
              aria-valuetext={`${formatDuration(displayTime)} of ${formatDuration(total)}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setScrubbing(true);
                seekFromClientX(e.currentTarget, e.clientX);
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                seekFromClientX(e.currentTarget, e.clientX);
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  seekFromClientX(e.currentTarget, e.clientX);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                setScrubbing(false);
              }}
              onPointerCancel={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                setScrubbing(false);
              }}
              onKeyDown={(e) => {
                if (!total) return;
                const step = e.shiftKey ? 60 : 5;
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  seek(Math.min((progress + step) / total, 1));
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  seek(Math.max((progress - step) / total, 0));
                } else if (e.key === "Home") {
                  e.preventDefault();
                  seek(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  seek(1);
                }
              }}
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10 transition group-hover:h-1.5">
                <div
                  className="h-full rounded-full bg-[color:var(--signal)]"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <div
                className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[color:var(--signal)] shadow-sm ring-2 ring-[color:var(--ink)] transition-opacity group-hover:opacity-100 sm:opacity-90"
                style={{ left: `calc(${ratio * 100}% - 7px)` }}
              />
            </div>
            <span className="w-9 shrink-0 text-[10px] tabular-nums text-[color:var(--mist)] sm:w-10 sm:text-xs">
              {formatDuration(total)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={playPrevious}
            disabled={!hasPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--foam)] transition hover:bg-white/10 disabled:opacity-30"
            aria-label="Previous track"
          >
            <SkipBack size={16} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)] transition hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={playNext}
            disabled={!hasNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--foam)] transition hover:bg-white/10 disabled:opacity-30"
            aria-label="Next track"
          >
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
