"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackStreamUrl } from "@/lib/stream";
import type { Track } from "@/lib/types";

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  duration: number;
  playTrack: (track: Track, queue?: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function nextIndex(queue: Track[], currentId: string, delta: number) {
  if (queue.length === 0) return -1;
  const idx = queue.findIndex((t) => t.id === currentId);
  if (idx < 0) return -1;
  const next = idx + delta;
  if (next < 0 || next >= queue.length) return -1;
  return next;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentRef = useRef<Track | null>(null);
  const loadTrackRef = useRef<(track: Track) => void>(() => {});

  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const loadTrack = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrent(track);
    currentRef.current = track;
    setProgress(0);
    setDuration(track.durationSec || 0);
    audio.src = trackStreamUrl(track.id);
    void audio.play().catch(() => {
      setPlaying(false);
    });
  }, []);

  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const q = queueRef.current;
      const cur = currentRef.current;
      if (!cur) {
        setPlaying(false);
        return;
      }
      const idx = nextIndex(q, cur.id, 1);
      if (idx >= 0) {
        loadTrackRef.current(q[idx]);
        return;
      }
      // Continuous streaming: wrap to the start of the catalog queue
      if (q.length > 1) {
        loadTrackRef.current(q[0]);
        return;
      }
      setPlaying(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const playTrack = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (nextQueue && nextQueue.length > 0) {
        setQueue(nextQueue);
        queueRef.current = nextQueue;
      } else if (!queueRef.current.some((t) => t.id === track.id)) {
        const solo = [track];
        setQueue(solo);
        queueRef.current = solo;
      }

      if (currentRef.current?.id === track.id) {
        if (audio.paused) void audio.play();
        else audio.pause();
        return;
      }

      loadTrack(track);
    },
    [loadTrack],
  );

  const playNext = useCallback(() => {
    const cur = currentRef.current;
    if (!cur) return;
    const idx = nextIndex(queueRef.current, cur.id, 1);
    if (idx >= 0) loadTrack(queueRef.current[idx]);
    else if (queueRef.current.length > 1) loadTrack(queueRef.current[0]);
  }, [loadTrack]);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    const cur = currentRef.current;
    if (!cur || !audio) return;

    // Restart current track if we're more than a few seconds in
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const idx = nextIndex(queueRef.current, cur.id, -1);
    if (idx >= 0) loadTrack(queueRef.current[idx]);
    else if (queueRef.current.length > 1) {
      loadTrack(queueRef.current[queueRef.current.length - 1]);
    } else {
      audio.currentTime = 0;
    }
  }, [loadTrack]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || !audio.duration) return;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
  }, []);

  const currentId = current?.id;
  const hasNext = Boolean(
    currentId &&
      (nextIndex(queue, currentId, 1) >= 0 || queue.length > 1),
  );
  const hasPrevious = Boolean(
    currentId &&
      (nextIndex(queue, currentId, -1) >= 0 ||
        queue.length > 1 ||
        progress > 3),
  );

  return (
    <PlayerContext.Provider
      value={{
        current,
        queue,
        playing,
        progress,
        duration,
        playTrack,
        playNext,
        playPrevious,
        toggle,
        seek,
        hasNext,
        hasPrevious,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
