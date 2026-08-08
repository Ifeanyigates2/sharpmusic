"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ListMusic,
  Loader2,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { QueuePanel } from "@/components/QueuePanel";
import { usePlayer } from "@/components/PlayerProvider";
import { artistPath, formatDuration } from "@/lib/format";

const SLEEP_OPTIONS = [15, 30, 45, 60] as const;

export function AudioPlayer() {
  const {
    current,
    playing,
    progress,
    duration,
    nextReason,
    nextSource,
    resolvingNext,
    upNext,
    shuffle,
    repeatMode,
    sleepEndsAt,
    playbackError,
    toggle,
    seek,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    setSleepMinutes,
    clearPlaybackError,
    hasNext,
    hasPrevious,
  } = usePlayer();

  const total = duration || current?.durationSec || 0;
  const liveRatio = total > 0 ? Math.min(progress / total, 1) : 0;
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [sleepLeft, setSleepLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!scrubbing) setScrubRatio(liveRatio);
  }, [liveRatio, scrubbing]);

  useEffect(() => {
    setQueueOpen(false);
    setSleepOpen(false);
  }, [current?.id]);

  useEffect(() => {
    if (!sleepEndsAt) {
      setSleepLeft(null);
      return;
    }
    const tick = () => {
      const ms = sleepEndsAt - Date.now();
      if (ms <= 0) {
        setSleepLeft(null);
        return;
      }
      const m = Math.floor(ms / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setSleepLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sleepEndsAt]);

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

  const nextLine = resolvingNext ? (
    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-[color:var(--signal)]/90">
      <Loader2 size={10} className="shrink-0 animate-spin" />
      Picking next song…
    </p>
  ) : upNext ? (
    <p className="mt-0.5 truncate text-[10px] text-[color:var(--signal)]/80">
      Next · {upNext.track.title}
      {upNext.source === "gemini"
        ? " · Gemini"
        : upNext.source === "user"
          ? " · You"
          : shuffle
            ? " · Shuffle"
            : ""}
    </p>
  ) : nextReason ? (
    <p className="mt-0.5 truncate text-[10px] text-[color:var(--signal)]/80">
      {nextSource === "gemini"
        ? "Gemini"
        : nextSource === "user"
          ? "You"
          : "Auto"}{" "}
      · {nextReason}
    </p>
  ) : null;

  return (
    <div className="player-bar fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[color:var(--ink)]/95 backdrop-blur-xl">
      <div className="relative">
        <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />

        <div className="mx-auto max-w-6xl px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
          {playbackError ? (
            <button
              type="button"
              onClick={() => {
                clearPlaybackError();
                toggle();
              }}
              className="mb-2 w-full rounded-sm bg-[color:var(--ember)]/15 px-3 py-1.5 text-left text-[11px] font-semibold text-[color:var(--ember)]"
            >
              {playbackError} — tap to retry
            </button>
          ) : null}

          {/* Mobile: meta + transport */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href={`/track/${current.id}`}
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
            >
              <CoverArt track={current} sizes="44px" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/track/${current.id}`}
                className="block truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-[color:var(--foam)]"
              >
                {current.title}
              </Link>
              <p className="truncate text-xs text-[color:var(--mist)]">
                <Link href={artistPath(current.artist)}>
                  {current.artist}
                </Link>
                {sleepLeft ? ` · Sleep ${sleepLeft}` : ""}
              </p>
              {nextLine}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setQueueOpen((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  queueOpen
                    ? "text-[color:var(--signal)]"
                    : "text-[color:var(--foam)]"
                }`}
                aria-label="Open queue"
              >
                <ListMusic size={16} />
              </button>
              <button
                type="button"
                onClick={toggle}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)]"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                onClick={playNext}
                disabled={!hasNext || resolvingNext}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--foam)] disabled:opacity-30"
                aria-label="Next track"
              >
                {resolvingNext ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <SkipForward size={16} fill="currentColor" />
                )}
              </button>
            </div>
          </div>

          {/* Seek — always */}
          <div className="mt-2 flex items-center gap-2 md:mt-0">
            <span className="hidden w-9 shrink-0 text-right text-[10px] tabular-nums text-[color:var(--mist)] sm:block sm:w-10 sm:text-xs md:hidden">
              {formatDuration(displayTime)}
            </span>
            <div
              className="group relative flex h-5 flex-1 cursor-pointer touch-none items-center md:hidden"
              role="slider"
              tabIndex={0}
              aria-label="Seek through track"
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(displayTime)}
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
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[color:var(--signal)]"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
            <span className="hidden w-9 shrink-0 text-[10px] tabular-nums text-[color:var(--mist)] sm:block sm:w-10 sm:text-xs md:hidden">
              {formatDuration(total)}
            </span>
          </div>

          {/* Mobile secondary controls */}
          <div className="mt-1.5 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  shuffle
                    ? "text-[color:var(--signal)]"
                    : "text-[color:var(--mist)]"
                }`}
                aria-label="Shuffle"
                aria-pressed={shuffle}
              >
                <Shuffle size={14} />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  repeatMode !== "off"
                    ? "text-[color:var(--signal)]"
                    : "text-[color:var(--mist)]"
                }`}
                aria-label={`Repeat ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={14} />
                ) : (
                  <Repeat size={14} />
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSleepOpen((v) => !v)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    sleepEndsAt
                      ? "text-[color:var(--signal)]"
                      : "text-[color:var(--mist)]"
                  }`}
                  aria-label="Sleep timer"
                >
                  <Moon size={14} />
                </button>
                {sleepOpen ? <SleepMenu setSleepMinutes={setSleepMinutes} onClose={() => setSleepOpen(false)} /> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={playPrevious}
              disabled={!hasPrevious}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--foam)] disabled:opacity-30"
              aria-label="Previous track"
            >
              <SkipBack size={14} fill="currentColor" />
            </button>
          </div>

          {/* Desktop layout */}
          <div className="hidden items-center gap-4 md:flex">
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
                <Link
                  href={artistPath(current.artist)}
                  className="hover:text-[color:var(--signal)]"
                >
                  {current.artist}
                </Link>
                {" · "}
                {current.country}
                {sleepLeft ? ` · Sleep ${sleepLeft}` : ""}
              </p>
              {nextLine}

              <div className="mt-2 flex items-center gap-2">
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[color:var(--mist)]">
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
                <span className="w-10 shrink-0 text-xs tabular-nums text-[color:var(--mist)]">
                  {formatDuration(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 ${
                    shuffle
                      ? "text-[color:var(--signal)]"
                      : "text-[color:var(--mist)]"
                  }`}
                  aria-label="Shuffle"
                  aria-pressed={shuffle}
                >
                  <Shuffle size={14} />
                </button>
                <button
                  type="button"
                  onClick={cycleRepeat}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 ${
                    repeatMode !== "off"
                      ? "text-[color:var(--signal)]"
                      : "text-[color:var(--mist)]"
                  }`}
                  aria-label={`Repeat ${repeatMode}`}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 size={14} />
                  ) : (
                    <Repeat size={14} />
                  )}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSleepOpen((v) => !v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 ${
                      sleepEndsAt
                        ? "text-[color:var(--signal)]"
                        : "text-[color:var(--mist)]"
                    }`}
                    aria-label="Sleep timer"
                  >
                    <Moon size={14} />
                  </button>
                  {sleepOpen ? (
                    <SleepMenu
                      setSleepMinutes={setSleepMinutes}
                      onClose={() => setSleepOpen(false)}
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQueueOpen((v) => !v)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 ${
                    queueOpen
                      ? "text-[color:var(--signal)]"
                      : "text-[color:var(--foam)]"
                  }`}
                  aria-label="Open queue"
                  aria-expanded={queueOpen}
                >
                  <ListMusic size={16} />
                </button>
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
                  disabled={!hasNext || resolvingNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--foam)] transition hover:bg-white/10 disabled:opacity-30"
                  aria-label="Next track"
                >
                  {resolvingNext ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <SkipForward size={16} fill="currentColor" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SleepMenu({
  setSleepMinutes,
  onClose,
}: {
  setSleepMinutes: (minutes: number | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 z-20 mb-2 w-36 overflow-hidden rounded-md border border-white/10 bg-[color:var(--ink)] shadow-xl md:left-auto md:right-0">
      {SLEEP_OPTIONS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => {
            setSleepMinutes(m);
            onClose();
          }}
          className="block w-full px-3 py-2 text-left text-xs font-semibold text-[color:var(--foam)] hover:bg-white/[0.06]"
        >
          {m} minutes
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          setSleepMinutes(null);
          onClose();
        }}
        className="block w-full border-t border-white/10 px-3 py-2 text-left text-xs font-semibold text-[color:var(--mist)] hover:bg-white/[0.06]"
      >
        Turn off
      </button>
    </div>
  );
}
