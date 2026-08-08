"use client";

import { useState } from "react";
import { Check, ListEnd, Pause, Play } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Track } from "@/lib/types";

export function PlayButton({
  track,
  queue,
  label = "Play preview",
}: {
  track: Track;
  queue?: Track[];
  label?: string;
}) {
  const { current, playing, playTrack, playAsNext, upNext } = usePlayer();
  const active = current?.id === track.id && playing;
  const isUpNext = upNext?.track.id === track.id;
  const [queuedFlash, setQueuedFlash] = useState(false);

  function onPlayNext() {
    playAsNext(track);
    setQueuedFlash(true);
    window.setTimeout(() => setQueuedFlash(false), 1400);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => playTrack(track, queue)}
        className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-5 py-3 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
      >
        {active ? <Pause size={16} /> : <Play size={16} />}
        {active ? "Pause" : label}
      </button>
      <button
        type="button"
        onClick={onPlayNext}
        disabled={current?.id === track.id}
        className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-5 py-3 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)] disabled:opacity-40"
      >
        {queuedFlash || isUpNext ? (
          <Check size={16} className="text-[color:var(--signal)]" />
        ) : (
          <ListEnd size={16} />
        )}
        {queuedFlash || isUpNext ? "Queued next" : "Play next"}
      </button>
    </div>
  );
}
