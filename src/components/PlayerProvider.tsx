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

type UpNext = {
  track: Track;
  reason: string;
  source: "gemini" | "fallback";
};

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  duration: number;
  nextReason: string | null;
  nextSource: "gemini" | "fallback" | null;
  resolvingNext: boolean;
  upNext: UpNext | null;
  playTrack: (track: Track, queue?: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  removeFromQueue: (trackId: string) => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const MAX_HISTORY = 15;

function nextIndex(queue: Track[], currentId: string, delta: number) {
  if (queue.length === 0) return -1;
  const idx = queue.findIndex((t) => t.id === currentId);
  if (idx < 0) return -1;
  const next = idx + delta;
  if (next < 0 || next >= queue.length) return -1;
  return next;
}

type RadioNextResponse = {
  track?: Track;
  reason?: string;
  source?: "gemini" | "fallback";
  error?: string;
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentRef = useRef<Track | null>(null);
  const historyRef = useRef<string[]>([]);
  const loadTrackRef = useRef<(track: Track, meta?: { reason?: string; source?: "gemini" | "fallback" }) => void>(
    () => {},
  );
  const resolveNextRef = useRef<() => Promise<void>>(async () => {});
  const prefetchRef = useRef<{
    fromId: string;
    track: Track;
    reason: string;
    source: "gemini" | "fallback";
  } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nextReason, setNextReason] = useState<string | null>(null);
  const [nextSource, setNextSource] = useState<"gemini" | "fallback" | null>(
    null,
  );
  const [resolvingNext, setResolvingNext] = useState(false);
  const [upNext, setUpNext] = useState<UpNext | null>(null);
  const durationRef = useRef(0);

  const rememberPlayed = useCallback((trackId: string) => {
    const next = [
      trackId,
      ...historyRef.current.filter((id) => id !== trackId),
    ].slice(0, MAX_HISTORY);
    historyRef.current = next;
  }, []);

  const sequentialFallback = useCallback((cur: Track): Track | null => {
    const q = queueRef.current;
    const idx = nextIndex(q, cur.id, 1);
    if (idx >= 0) return q[idx];
    if (q.length > 1) return q[0];
    return null;
  }, []);

  const fetchAiNext = useCallback(
    async (cur: Track, signal?: AbortSignal) => {
      const candidateIds = queueRef.current.map((t) => t.id);
      const res = await fetch("/api/radio/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentId: cur.id,
          recentIds: historyRef.current,
          candidateIds:
            candidateIds.length > 1 ? candidateIds : undefined,
        }),
        signal,
      });
      const data = (await res.json()) as RadioNextResponse;
      if (!res.ok || !data.track) {
        throw new Error(data.error || "Could not pick next track");
      }
      return {
        track: data.track,
        reason: data.reason || "AI pick",
        source: data.source === "gemini" ? "gemini" : "fallback",
      } as const;
    },
    [],
  );

  const prefetchNext = useCallback(
    (from: Track) => {
      prefetchAbortRef.current?.abort();
      const controller = new AbortController();
      prefetchAbortRef.current = controller;
      prefetchRef.current = null;
      setUpNext(null);

      void (async () => {
        try {
          const pick = await fetchAiNext(from, controller.signal);
          if (controller.signal.aborted) return;
          if (currentRef.current?.id !== from.id) return;
          const next: UpNext = {
            track: pick.track,
            reason: pick.reason,
            source: pick.source,
          };
          prefetchRef.current = {
            fromId: from.id,
            ...next,
          };
          setUpNext(next);
        } catch {
          // Prefetch is best-effort; ended/skip will resolve live
        }
      })();
    },
    [fetchAiNext],
  );

  const loadTrack = useCallback(
    (
      track: Track,
      meta?: { reason?: string; source?: "gemini" | "fallback" },
    ) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentRef.current) {
        rememberPlayed(currentRef.current.id);
      }

      setCurrent(track);
      currentRef.current = track;
      setProgress(0);
      const fallbackDur = track.durationSec || 0;
      durationRef.current = fallbackDur;
      setDuration(fallbackDur);
      setNextReason(meta?.reason ?? null);
      setNextSource(meta?.source ?? null);
      prefetchRef.current = null;
      setUpNext(null);
      audio.src = trackStreamUrl(track.id);
      void audio.play().catch(() => {
        setPlaying(false);
      });
      prefetchNext(track);
    },
    [prefetchNext, rememberPlayed],
  );

  const resolveAndPlayNext = useCallback(async () => {
    const cur = currentRef.current;
    if (!cur) {
      setPlaying(false);
      return;
    }

    const pref = prefetchRef.current;
    if (pref && pref.fromId === cur.id) {
      loadTrack(pref.track, { reason: pref.reason, source: pref.source });
      return;
    }

    setResolvingNext(true);
    try {
      const pick = await fetchAiNext(cur);
      loadTrack(pick.track, { reason: pick.reason, source: pick.source });
    } catch {
      const fallback = sequentialFallback(cur);
      if (fallback) {
        loadTrack(fallback, {
          reason: "Next in catalog",
          source: "fallback",
        });
      } else {
        setPlaying(false);
      }
    } finally {
      setResolvingNext(false);
    }
  }, [fetchAiNext, loadTrack, sequentialFallback]);

  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  useEffect(() => {
    resolveNextRef.current = resolveAndPlayNext;
  }, [resolveAndPlayNext]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      const dur =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : durationRef.current;
      durationRef.current = dur;
      setDuration(dur);
    };
    const onDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        durationRef.current = audio.duration;
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      void resolveNextRef.current();
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      prefetchAbortRef.current?.abort();
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onDuration);
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
    void resolveAndPlayNext();
  }, [resolveAndPlayNext]);

  const removeFromQueue = useCallback((trackId: string) => {
    const cur = currentRef.current;
    if (cur?.id === trackId) return;

    const nextQueue = queueRef.current.filter((t) => t.id !== trackId);
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    if (upNext?.track.id === trackId) {
      prefetchRef.current = null;
      setUpNext(null);
      if (cur) prefetchNext(cur);
    }
  }, [prefetchNext, upNext?.track.id]);

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
    if (!audio) return;
    const dur =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : durationRef.current;
    if (!dur || !Number.isFinite(dur)) return;
    const next = Math.min(Math.max(ratio, 0), 1) * dur;
    try {
      audio.currentTime = next;
      setProgress(next);
    } catch {
      // Some browsers throw if the media isn't seekable yet
    }
  }, []);

  const currentId = current?.id;
  const hasNext = Boolean(currentId && queue.length > 0);
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
        nextReason,
        nextSource,
        resolvingNext,
        upNext,
        playTrack,
        playNext,
        playPrevious,
        removeFromQueue,
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
