"use client";

import Image from "next/image";
import { coverGradient } from "@/lib/format";
import type { Track } from "@/lib/types";

export function CoverArt({
  track,
  className = "",
  sizes = "200px",
  priority = false,
}: {
  track: Pick<Track, "title" | "coverHue" | "coverImageUrl">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (track.coverImageUrl) {
    return (
      <Image
        src={track.coverImageUrl}
        alt={`${track.title} cover`}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ background: coverGradient(track.coverHue) }}
      aria-hidden
    />
  );
}
