"use client";

import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/components/PlayerProvider";
import type { Track } from "@/lib/types";

export function PlayButton({ track, label = "Play preview" }: { track: Track; label?: string }) {
  const { current, playing, playTrack } = usePlayer();
  const active = current?.id === track.id && playing;

  return (
    <button
      type="button"
      onClick={() => playTrack(track)}
      className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-5 py-3 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
    >
      {active ? <Pause size={16} /> : <Play size={16} />}
      {active ? "Pause" : label}
    </button>
  );
}
