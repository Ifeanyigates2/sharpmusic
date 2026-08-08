"use client";

import { useEffect, useRef, useState } from "react";
import { TrackCard } from "@/components/TrackCard";
import type { Track } from "@/lib/types";

export function CatalogScroller({
  tracks,
  queue,
  favoriteIds = [],
}: {
  tracks: Track[];
  /** Full catalog for continuous autoplay (defaults to visible tracks). */
  queue?: Track[];
  favoriteIds?: string[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(40);
  const playQueue = queue ?? tracks;
  const favoriteSet = new Set(favoriteIds);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.scrollWidth;
      // ~40px/s keeps motion readable; clamp for short catalogs
      setDuration(Math.max(28, Math.min(70, width / 40)));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tracks]);

  if (tracks.length === 0) {
    return (
      <p className="px-4 text-sm text-[color:var(--mist)] md:px-6">
        No tracks yet. Check back soon.
      </p>
    );
  }

  const loop = [...tracks, ...tracks];

  return (
    <div
      className="catalog-marquee"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={`catalog-marquee-track ${paused ? "is-paused" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <div ref={trackRef} className="catalog-marquee-group">
          {loop.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              className="w-[42vw] max-w-[200px] min-w-[148px] shrink-0 sm:w-[180px] sm:max-w-none"
              aria-hidden={i >= tracks.length}
            >
              <TrackCard
                track={track}
                queue={playQueue}
                favorited={favoriteSet.has(track.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
