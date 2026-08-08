"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { formatPrice } from "@/lib/format";
import type { Track } from "@/lib/types";

type AdminTrack = Track & { source: "uploaded" | "demo" };

export function AdminTrackList({ tracks }: { tracks: AdminTrack[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(track: AdminTrack) {
    const ok = window.confirm(
      `Delete “${track.title}” by ${track.artist}? This cannot be undone.`,
    );
    if (!ok) return;

    setBusyId(track.id);
    setError(null);
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (tracks.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-[color:var(--mist)]">
        No tracks yet.{" "}
        <Link href="/upload" className="text-[color:var(--signal)] hover:underline">
          Upload one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
          {error}
        </p>
      )}

      <ul className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        {tracks.map((track) => (
          <li
            key={track.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                <CoverArt track={track} sizes="56px" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-display)] font-semibold text-[color:var(--foam)]">
                  {track.title}
                </p>
                <p className="truncate text-sm text-[color:var(--mist)]">
                  {track.artist} · {track.genre} ·{" "}
                  {track.pricing === "free"
                    ? "Free"
                    : formatPrice(track.priceCents)}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--mist)]">
                  {track.source === "demo" ? "Demo catalog" : "Uploaded"}
                  {track.videoUrl ? " · Music video" : ""}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/admin/tracks/${track.id}`}
                className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
              >
                <Pencil size={14} />
                Edit
              </Link>
              <button
                type="button"
                disabled={busyId === track.id}
                onClick={() => onDelete(track)}
                className="inline-flex items-center gap-2 rounded-sm border border-[color:var(--ember)]/40 px-3 py-2 text-xs font-semibold text-[color:var(--ember)] transition hover:bg-[color:var(--ember)]/10 disabled:opacity-60"
              >
                {busyId === track.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
