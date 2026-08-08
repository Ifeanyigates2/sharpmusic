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

export type RepeatMode = "off" | "one" | "all";

type UpNext = {
  track: Track;
  reason: string;
  source: "gemini" | "fallback" | "user";
};

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  duration: number;
  nextReason: string | null;
  nextSource: "gemini" | "fallback" | "user" | null;
  resolvingNext: boolean;
  upNext: UpNext | null;
  shuffle: boolean;
  repeatMode: RepeatMode;
  sleepEndsAt: number | null;
  playTrack: (track: Track, queue?: Track[]) => void;
  playAsNext: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (orderedUpcomingIds: string[]) => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSleepMinutes: (minutes: number | null) => void;
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
  const loadTrackRef = useRef<
    (
      track: Track,
      meta?: { reason?: string; source?: "gemini" | "fallback" | "user" },
    ) => void
  >(() => {});
  const resolveNextRef = useRef<() => Promise<void>>(async () => {});
  const prefetchRef = useRef<{
    fromId: string;
    track: Track;
    reason: string;
    source: "gemini" | "fallback" | "user";
  } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const userNextPinnedRef = useRef(false);
  const shuffleRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>("off");
  const sleepTimerRef = useRef<number | null>(null);

  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nextReason, setNextReason] = useState<string | null>(null);
  const [nextSource, setNextSource] = useState<
    "gemini" | "fallback" | "user" | null
  >(null);
  const [resolvingNext, setResolvingNext] = useState(false);
  const [upNext, setUpNext] = useState<UpNext | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
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

  const shuffleFallback = useCallback((cur: Track): Track | null => {
    const candidates = queueRef.current.filter((t) => t.id !== cur.id);
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
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
          candidateIds: candidateIds.length > 1 ? candidateIds : undefined,
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
      if (userNextPinnedRef.current) return;
      if (shuffleRef.current) {
        const pick = shuffleFallback(from);
        if (pick) {
          const next: UpNext = {
            track: pick,
            reason: "Shuffle",
            source: "fallback",
          };
          prefetchRef.current = { fromId: from.id, ...next };
          setUpNext(next);
        } else {
          prefetchRef.current = null;
          setUpNext(null);
        }
        return;
      }

      prefetchAbortRef.current?.abort();
      const controller = new AbortController();
      prefetchAbortRef.current = controller;
      prefetchRef.current = null;
      setUpNext(null);

      void (async () => {
        try {
          const pick = await fetchAiNext(from, controller.signal);
          if (controller.signal.aborted) return;
          if (userNextPinnedRef.current) return;
          if (shuffleRef.current) return;
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
          // Prefetch is best-effort
        }
      })();
    },
    [fetchAiNext, shuffleFallback],
  );

  const loadTrack = useCallback(
    (
      track: Track,
      meta?: { reason?: string; source?: "gemini" | "fallback" | "user" },
    ) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentRef.current) {
        rememberPlayed(currentRef.current.id);
      }

      userNextPinnedRef.current = false;
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
      void fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      }).catch(() => {});
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

    if (repeatModeRef.current === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => setPlaying(false));
      }
      return;
    }

    const pref = prefetchRef.current;
    if (pref && pref.fromId === cur.id) {
      loadTrack(pref.track, { reason: pref.reason, source: pref.source });
      return;
    }

    if (shuffleRef.current) {
      const pick = shuffleFallback(cur);
      if (pick) {
        loadTrack(pick, { reason: "Shuffle", source: "fallback" });
        return;
      }
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
      } else if (repeatModeRef.current === "all" && queueRef.current[0]) {
        loadTrack(queueRef.current[0], {
          reason: "Repeat queue",
          source: "fallback",
        });
      } else {
        setPlaying(false);
      }
    } finally {
      setResolvingNext(false);
    }
  }, [fetchAiNext, loadTrack, sequentialFallback, shuffleFallback]);

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
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
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

  const playAsNext = useCallback(
    (track: Track) => {
      const cur = currentRef.current;
      if (!cur) {
        playTrack(track);
        return;
      }
      if (cur.id === track.id) return;

      const without = queueRef.current.filter((t) => t.id !== track.id);
      const curIdx = without.findIndex((t) => t.id === cur.id);
      if (curIdx >= 0) without.splice(curIdx + 1, 0, track);
      else without.push(cur, track);

      queueRef.current = without;
      setQueue(without);

      prefetchAbortRef.current?.abort();
      userNextPinnedRef.current = true;
      const next: UpNext = {
        track,
        reason: "Play next",
        source: "user",
      };
      prefetchRef.current = { fromId: cur.id, ...next };
      setUpNext(next);
    },
    [playTrack],
  );

  const playNext = useCallback(() => {
    void resolveAndPlayNext();
  }, [resolveAndPlayNext]);

  const removeFromQueue = useCallback(
    (trackId: string) => {
      const cur = currentRef.current;
      if (cur?.id === trackId) return;

      const nextQueue = queueRef.current.filter((t) => t.id !== trackId);
      queueRef.current = nextQueue;
      setQueue(nextQueue);

      if (upNext?.track.id === trackId) {
        userNextPinnedRef.current = false;
        prefetchRef.current = null;
        setUpNext(null);
        if (cur) prefetchNext(cur);
      }
    },
    [prefetchNext, upNext?.track.id],
  );

  const reorderQueue = useCallback(
    (orderedUpcomingIds: string[]) => {
      const cur = currentRef.current;
      if (!cur) return;

      const byId = new Map(queueRef.current.map((t) => [t.id, t]));
      const upcoming = orderedUpcomingIds
        .map((id) => byId.get(id))
        .filter((t): t is Track => t != null && t.id !== cur.id);

      // Keep any queue tracks not listed (safety) after the ordered ones
      const seen = new Set([cur.id, ...upcoming.map((t) => t.id)]);
      const rest = queueRef.current.filter((t) => !seen.has(t.id));
      const nextQueue = [cur, ...upcoming, ...rest];
      queueRef.current = nextQueue;
      setQueue(nextQueue);

      // If user had pinned next and it's still first upcoming, keep pin
      const first = upcoming[0];
      if (
        userNextPinnedRef.current &&
        first &&
        upNext?.track.id === first.id
      ) {
        prefetchRef.current = {
          fromId: cur.id,
          track: first,
          reason: "Play next",
          source: "user",
        };
        setUpNext({
          track: first,
          reason: "Play next",
          source: "user",
        });
      } else if (!userNextPinnedRef.current && first && shuffleRef.current) {
        const next: UpNext = {
          track: first,
          reason: "Shuffle",
          source: "fallback",
        };
        prefetchRef.current = { fromId: cur.id, ...next };
        setUpNext(next);
      }
    },
    [upNext?.track.id],
  );

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    const cur = currentRef.current;
    if (!cur || !audio) return;

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
      // ignore
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      shuffleRef.current = next;
      const cur = currentRef.current;
      if (cur && !userNextPinnedRef.current) {
        prefetchNext(cur);
      }
      return next;
    });
  }, [prefetchNext]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next: RepeatMode =
        prev === "off" ? "all" : prev === "all" ? "one" : "off";
      repeatModeRef.current = next;
      return next;
    });
  }, []);

  const setSleepMinutes = useCallback((minutes: number | null) => {
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (!minutes || minutes <= 0) {
      setSleepEndsAt(null);
      return;
    }
    const endsAt = Date.now() + minutes * 60_000;
    setSleepEndsAt(endsAt);
    sleepTimerRef.current = window.setTimeout(() => {
      audioRef.current?.pause();
      setSleepEndsAt(null);
      sleepTimerRef.current = null;
    }, minutes * 60_000);
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
        shuffle,
        repeatMode,
        sleepEndsAt,
        playTrack,
        playAsNext,
        playNext,
        playPrevious,
        removeFromQueue,
        reorderQueue,
        toggle,
        seek,
        toggleShuffle,
        cycleRepeat,
        setSleepMinutes,
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
