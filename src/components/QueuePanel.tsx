"use client";

import Link from "next/link";
import { ListMusic, Loader2, X } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayer } from "@/components/PlayerProvider";
import type { Track } from "@/lib/types";

export function QueuePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    current,
    queue,
    upNext,
    resolvingNext,
    nextSource,
    playTrack,
    removeFromQueue,
  } = usePlayer();

  if (!open || !current) return null;

  const upcoming = queue.filter(
    (t) =>
      t.id !== current.id &&
      t.id !== upNext?.track.id,
  );

  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-2 px-4 md:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[color:var(--ink)]/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foam)]">
            <ListMusic size={16} />
            Queue
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-[color:var(--mist)] hover:text-[color:var(--foam)]"
            aria-label="Close queue"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[min(50vh,22rem)] overflow-y-auto">
          <QueueRow
            track={current}
            label="Now playing"
            active
            onPlay={() => playTrack(current, queue)}
          />

          {resolvingNext && !upNext ? (
            <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-xs text-[color:var(--signal)]">
              <Loader2 size={12} className="animate-spin" />
              Picking next song…
            </div>
          ) : null}

          {upNext ? (
            <QueueRow
              track={upNext.track}
              label={
                upNext.source === "gemini"
                  ? `Up next · Gemini · ${upNext.reason}`
                  : `Up next · ${upNext.reason}`
              }
              onPlay={() => playTrack(upNext.track, queue)}
              onRemove={() => removeFromQueue(upNext.track.id)}
            />
          ) : null}

          {upcoming.map((track) => (
            <QueueRow
              key={track.id}
              track={track}
              onPlay={() => playTrack(track, queue)}
              onRemove={() => removeFromQueue(track.id)}
            />
          ))}

          {!upNext && !resolvingNext && upcoming.length === 0 ? (
            <p className="border-t border-white/10 px-4 py-4 text-xs text-[color:var(--mist)]">
              {nextSource
                ? "Queue will fill as Gemini picks the next track."
                : "Play more tracks from Browse to build a queue."}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QueueRow({
  track,
  label,
  active,
  onPlay,
  onRemove,
}: {
  track: Track;
  label?: string;
  active?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-t border-white/10 px-4 py-2.5 ${
        active ? "bg-white/[0.04]" : ""
      }`}
    >
      <button
        type="button"
        onClick={onPlay}
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm"
        aria-label={`Play ${track.title}`}
      >
        <CoverArt track={track} sizes="40px" />
      </button>
      <button
        type="button"
        onClick={onPlay}
        className="min-w-0 flex-1 text-left"
      >
        {label ? (
          <p className="truncate text-[10px] uppercase tracking-wider text-[color:var(--signal)]">
            {label}
          </p>
        ) : null}
        <p className="truncate text-sm font-semibold text-[color:var(--foam)]">
          {track.title}
        </p>
        <p className="truncate text-xs text-[color:var(--mist)]">
          <Link
            href={`/track/${track.id}`}
            className="hover:text-[color:var(--signal)]"
            onClick={(e) => e.stopPropagation()}
          >
            {track.artist}
          </Link>
        </p>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-sm p-1.5 text-[color:var(--mist)] hover:text-[color:var(--ember)]"
          aria-label={`Remove ${track.title} from queue`}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
