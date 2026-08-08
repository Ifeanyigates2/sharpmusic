"use client";

import { useEffect, useState } from "react";
import { Check, ListPlus, Loader2 } from "lucide-react";
import type { Playlist } from "@/lib/playlists";

export function AddToPlaylistButton({ trackId }: { trackId: string }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/playlists");
        const data = await res.json();
        if (!cancelled) {
          setPlaylists(Array.isArray(data.playlists) ? data.playlists : []);
        }
      } catch {
        if (!cancelled) setError("Could not load playlists");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addTo(playlistId: string) {
    setBusyId(playlistId);
    setError(null);
    try {
      const res = await fetch("/api/playlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          trackId,
          action: "add",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add track");
      setPlaylists(Array.isArray(data.playlists) ? data.playlists : playlists);
      setDoneId(playlistId);
      window.setTimeout(() => setDoneId(null), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add track");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-5 py-3 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
      >
        <ListPlus size={16} />
        Add to playlist
      </button>

      {open ? (
        <div className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-lg border border-white/10 bg-[color:var(--ink)] shadow-xl">
          <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--mist)]">
            Your playlists
          </div>
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-[color:var(--mist)]">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </p>
          ) : playlists.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[color:var(--mist)]">
              No playlists yet. Create one under Playlists.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => addTo(p.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[color:var(--foam)] transition hover:bg-white/[0.05] disabled:opacity-60"
                  >
                    <span className="truncate">{p.name}</span>
                    {busyId === p.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : doneId === p.id ? (
                      <Check size={14} className="text-[color:var(--signal)]" />
                    ) : (
                      <span className="text-xs text-[color:var(--mist)]">
                        {p.trackIds.length}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error ? (
            <p className="border-t border-white/10 px-3 py-2 text-xs text-[color:var(--ember)]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
