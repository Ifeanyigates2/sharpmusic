"use client";

import Link from "next/link";
import { useState } from "react";
import { GripVertical, ListMusic, Loader2, X } from "lucide-react";
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
    reorderQueue,
  } = usePlayer();
  const [dragId, setDragId] = useState<string | null>(null);

  if (!open || !current) return null;

  const upcoming = queue.filter(
    (t) => t.id !== current.id && t.id !== upNext?.track.id,
  );

  function onDropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = upcoming.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const withUpNext =
      upNext && upNext.track.id !== current?.id
        ? [upNext.track.id, ...next.filter((id) => id !== upNext.track.id)]
        : next;
    reorderQueue(withUpNext);
    setDragId(null);
  }

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
                upNext.source === "user"
                  ? "Up next · You picked"
                  : upNext.source === "gemini"
                    ? `Up next · Gemini · ${upNext.reason}`
                    : `Up next · ${upNext.reason}`
              }
              onPlay={() => playTrack(upNext.track, queue)}
              onRemove={() => removeFromQueue(upNext.track.id)}
            />
          ) : null}

          {upcoming.length > 0 ? (
            <p className="border-t border-white/10 px-4 py-2 text-[10px] uppercase tracking-wider text-[color:var(--mist)]">
              Drag to reorder
            </p>
          ) : null}

          {upcoming.map((track) => (
            <QueueRow
              key={track.id}
              track={track}
              draggable
              dragging={dragId === track.id}
              onDragStart={() => setDragId(track.id)}
              onDragEnd={() => setDragId(null)}
              onDrop={() => onDropOn(track.id)}
              onPlay={() => playTrack(track, queue)}
              onRemove={() => removeFromQueue(track.id)}
            />
          ))}

          {!upNext && !resolvingNext && upcoming.length === 0 ? (
            <p className="border-t border-white/10 px-4 py-4 text-xs text-[color:var(--mist)]">
              {nextSource
                ? "Queue will fill as the next track is picked."
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
  draggable,
  dragging,
  onPlay,
  onRemove,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  track: Track;
  label?: string;
  active?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 border-t border-white/10 px-3 py-2.5 sm:gap-3 sm:px-4 ${
        active ? "bg-white/[0.04]" : ""
      } ${dragging ? "opacity-50" : ""}`}
      draggable={Boolean(draggable)}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDrop?.();
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      {draggable ? (
        <span className="cursor-grab text-[color:var(--mist)] active:cursor-grabbing">
          <GripVertical size={14} />
        </span>
      ) : (
        <span className="w-3.5" />
      )}
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
