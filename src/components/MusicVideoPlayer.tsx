"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/components/PlayerProvider";

const VIDEO_PAUSE_EVENT = "sharpmusic:pause-videos";

export function pauseAllPageVideos() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VIDEO_PAUSE_EVENT));
}

export function MusicVideoPlayer({
  src,
  title,
  poster,
  label = "Music video",
}: {
  src: string;
  title: string;
  poster?: string;
  label?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { playing, toggle } = usePlayer();
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      // Pause other videos on the page
      document.querySelectorAll("video").forEach((el) => {
        if (el !== video && !el.paused) el.pause();
      });
      // Pause the audio bar so video and stream don't fight
      if (playingRef.current) toggle();
    };

    const onExternalPause = () => {
      if (!video.paused) video.pause();
    };

    video.addEventListener("play", onPlay);
    window.addEventListener(VIDEO_PAUSE_EVENT, onExternalPause);
    return () => {
      video.removeEventListener("play", onPlay);
      window.removeEventListener(VIDEO_PAUSE_EVENT, onExternalPause);
    };
  }, [toggle]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
      <video
        ref={videoRef}
        className="aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        aria-label={`${label} — ${title}`}
      >
        <source src={src} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
