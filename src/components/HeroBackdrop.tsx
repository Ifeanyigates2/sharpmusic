"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { coverGradient } from "@/lib/format";
import type { Track } from "@/lib/types";

type CoverSlide = Pick<Track, "id" | "title" | "coverImageUrl" | "coverHue">;

const INTERVAL_MS = 5500;

export function HeroBackdrop({ covers }: { covers: CoverSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (covers.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % covers.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [covers.length]);

  if (covers.length === 0) return <div className="hero-veil" />;

  return (
    <>
      {covers.map((cover, i) => {
        const isActive = i === active;
        return (
          <div
            key={cover.id}
            className={`hero-slide ${isActive ? "is-active" : ""}`}
            aria-hidden={!isActive}
          >
            {cover.coverImageUrl ? (
              <Image
                src={cover.coverImageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="hero-cover object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 hero-cover"
                style={{ background: coverGradient(cover.coverHue) }}
              />
            )}
          </div>
        );
      })}
      <div className="hero-veil" />
    </>
  );
}
