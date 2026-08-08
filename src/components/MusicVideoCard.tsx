"use client";

import Image from "next/image";
import Link from "next/link";
import { Film, Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayer } from "@/components/PlayerProvider";
import { artistPath } from "@/lib/format";
import type { Track } from "@/lib/types";

/** Video-first card for the music videos page. */
export function MusicVideoCard({
  track,
  queue,
}: {
  track: Track;
  queue?: Track[];
}) {
  const { current, playing, playTrack } = usePlayer();
  const active = current?.id === track.id && playing;
  const watchHref = `/track/${track.id}#video`;

  return (
    <article className="group">
      <Link
        href={watchHref}
        className="relative block aspect-video w-full overflow-hidden rounded-sm bg-white/[0.03]"
        aria-label={`Watch video — ${track.title}`}
      >
        {track.coverImageUrl ? (
          <Image
            src={track.coverImageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:640px) 50vw, 280px"
          />
        ) : (
          <CoverArt track={track} sizes="(max-width:640px) 50vw, 280px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)]">
          <Film size={10} />
          Watch
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--signal)] text-[color:var(--ink)]">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </span>
      </Link>

      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={watchHref}
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
        <button
          type="button"
          onClick={() => playTrack(track, queue)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/15 text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
          aria-label={active ? `Pause ${track.title}` : `Play audio ${track.title}`}
        >
          {active ? (
            <Pause size={12} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </button>
      </div>
    </article>
  );
}
