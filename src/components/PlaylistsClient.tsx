"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Playlist } from "@/lib/playlists";

export function PlaylistsClient({
  initialPlaylists,
  likedCount,
}: {
  initialPlaylists: Playlist[];
  likedCount: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create playlist");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create playlist");
    } finally {
      setBusy(false);
    }
  }

  async function removePlaylist(id: string, playlistName: string) {
    const ok = window.confirm(`Delete playlist “${playlistName}”?`);
    if (!ok) return;
    setDeletingId(id);
    try {
      await fetch("/api/playlists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: id }),
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href="/favorites"
        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-[color:var(--signal)]/40"
      >
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
            Liked
          </p>
          <p className="mt-1 text-sm text-[color:var(--mist)]">
            {likedCount} saved track{likedCount === 1 ? "" : "s"}
          </p>
        </div>
        <span className="text-sm font-semibold text-[color:var(--signal)]">
          Open →
        </span>
      </Link>

      <form
        onSubmit={createPlaylist}
        className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
          New playlist
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            placeholder="e.g. Sunday Gospel"
            className="field flex-1"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[color:var(--ember)]">{error}</p>
        ) : null}
      </form>

      {initialPlaylists.length === 0 ? (
        <p className="text-sm text-[color:var(--mist)]">
          No custom playlists yet. Create one above, then add tracks from any
          song page.
        </p>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
          {initialPlaylists.map((playlist) => (
            <li
              key={playlist.id}
              className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
            >
              <Link href={`/playlists/${playlist.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[color:var(--foam)] hover:text-[color:var(--signal)]">
                  {playlist.name}
                </p>
                <p className="mt-1 text-sm text-[color:var(--mist)]">
                  {playlist.trackIds.length} track
                  {playlist.trackIds.length === 1 ? "" : "s"}
                </p>
              </Link>
              <button
                type="button"
                disabled={deletingId === playlist.id}
                onClick={() => removePlaylist(playlist.id, playlist.name)}
                className="rounded-sm border border-[color:var(--ember)]/40 p-2 text-[color:var(--ember)] transition hover:bg-[color:var(--ember)]/10 disabled:opacity-60"
                aria-label={`Delete ${playlist.name}`}
              >
                {deletingId === playlist.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
