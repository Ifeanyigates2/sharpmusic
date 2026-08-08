"use client";

import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Track } from "@/lib/types";

export function PlayAllButton({
  tracks,
  label = "Play all",
}: {
  tracks: Track[];
  label?: string;
}) {
  const { current, playing, queue, playTrack, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  const queueMatches =
    queue.length === tracks.length &&
    queue.every((t, i) => t.id === tracks[i]?.id);
  const first = tracks[0];
  const isPlayingThisList =
    queueMatches &&
    Boolean(current) &&
    tracks.some((t) => t.id === current?.id) &&
    playing;

  function onClick() {
    if (isPlayingThisList) {
      toggle();
      return;
    }
    if (
      queueMatches &&
      current &&
      tracks.some((t) => t.id === current.id) &&
      !playing
    ) {
      toggle();
      return;
    }
    playTrack(first, tracks);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
    >
      {isPlayingThisList ? (
        <Pause size={16} fill="currentColor" />
      ) : (
        <Play size={16} fill="currentColor" />
      )}
      {isPlayingThisList ? "Pause" : label}
    </button>
  );
}
