"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { Track } from "@/lib/types";

export function CatalogSearch({
  onRecommend,
}: {
  onRecommend?: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deferredQuery) {
      setTracks([]);
      setSearched(false);
      setError(null);
      setPending(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/tracks?q=${encodeURIComponent(deferredQuery)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setTracks(Array.isArray(data.tracks) ? data.tracks.slice(0, 8) : []);
        setSearched(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setTracks([]);
        setSearched(true);
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery]);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--mist)]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, genre…"
          className="w-full rounded-sm border border-white/10 bg-[color:var(--ink)] py-3 pl-10 pr-3 text-sm text-[color:var(--foam)] outline-none ring-[color:var(--signal)] placeholder:text-[color:var(--mist)] focus:ring-1"
          aria-label="Search the catalog"
        />
        {pending && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[color:var(--mist)]"
          />
        )}
      </label>

      {error && (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
          {error}
        </p>
      )}

      {searched && !error && (
        <div className="space-y-3">
          {tracks.length > 0 ? (
            <>
              <p className="text-sm text-[color:var(--mist)]">
                {tracks.length} match{tracks.length === 1 ? "" : "es"} in the
                catalog
              </p>
              <ul className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                {tracks.map((track) => (
                  <li key={track.id}>
                    <Link
                      href={`/track/${track.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[color:var(--foam)]">
                          {track.title}
                        </p>
                        <p className="truncate text-sm text-[color:var(--mist)]">
                          {track.artist} · {track.genre}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-[color:var(--signal)]">
                        Open →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[color:var(--mist)]">
                Don&apos;t see what you want?{" "}
                {onRecommend ? (
                  <button
                    type="button"
                    onClick={() => onRecommend(deferredQuery)}
                    className="font-semibold text-[color:var(--signal)] hover:underline"
                  >
                    Recommend “{deferredQuery}”
                  </button>
                ) : (
                  "Recommend it below."
                )}
              </p>
            </>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--mist)]">
              <p>
                No catalog matches for “{deferredQuery}”. Recommend the song
                below and we&apos;ll consider adding it.
              </p>
              {onRecommend && (
                <button
                  type="button"
                  onClick={() => onRecommend(deferredQuery)}
                  className="mt-3 text-sm font-semibold text-[color:var(--signal)] hover:underline"
                >
                  Use “{deferredQuery}” in the form →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
