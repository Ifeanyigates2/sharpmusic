"use client";

import { useState } from "react";
import type { ArtistProfile } from "@/lib/news-types";

export function AdminArtistSocialForm({
  artists,
}: {
  artists: ArtistProfile[];
}) {
  const [rows, setRows] = useState(artists);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (
    nameKey: string,
    field: "instagram" | "facebook" | "threads" | "twitter",
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((a) => (a.nameKey === nameKey ? { ...a, [field]: value } : a)),
    );
  };

  const save = async (artist: ArtistProfile) => {
    setSaving(artist.nameKey);
    setMessage("");
    try {
      const res = await fetch("/api/artists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameKey: artist.nameKey,
          instagram: artist.instagram,
          facebook: artist.facebook,
          threads: artist.threads,
          twitter: artist.twitter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(`Saved ${artist.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/news/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      const errNote =
        data.errors?.length > 0
          ? ` (${data.errors.length} platform warnings)`
          : "";
      setMessage(
        `Synced ${data.posts ?? 0} posts from ${data.artists ?? 0} artists${errNote}`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="rounded-sm bg-[color:var(--signal)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60"
        >
          {syncing ? "Syncing…" : "Sync latest posts"}
        </button>
        {message ? (
          <p className="text-sm text-[color:var(--mist)]">{message}</p>
        ) : null}
      </div>

      <p className="text-sm text-[color:var(--mist)]">
        Add Instagram, Facebook, Threads, and X (Twitter) usernames for each
        artist with songs on Sharp Music. Then sync to pull their latest posts
        into Music News.
      </p>

      <div className="space-y-6">
        {rows.map((artist) => (
          <div
            key={artist.nameKey}
            className="border-t border-white/10 pt-5"
          >
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
              {artist.name}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["instagram", "Instagram"],
                  ["facebook", "Facebook page"],
                  ["threads", "Threads"],
                  ["twitter", "X / Twitter"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="block text-xs text-[color:var(--mist)]">
                  {label}
                  <input
                    className="field mt-1"
                    value={artist[field]}
                    placeholder="username"
                    onChange={(e) =>
                      updateField(artist.nameKey, field, e.target.value)
                    }
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => save(artist)}
              disabled={saving === artist.nameKey}
              className="mt-3 rounded-sm border border-white/15 px-3 py-1.5 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)] disabled:opacity-60"
            >
              {saving === artist.nameKey ? "Saving…" : "Save handles"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
