"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { GENRES } from "@/lib/types";

export function SongRequestForm({
  initialTitle = "",
  initialArtist = "",
}: {
  initialTitle?: string;
  initialArtist?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      artist: String(fd.get("artist") ?? ""),
      genre: String(fd.get("genre") ?? ""),
      link: String(fd.get("link") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      email: String(fd.get("email") ?? ""),
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send request");
      setDone(true);
      e.currentTarget.reset();
      setTitle("");
      setArtist("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-[color:var(--signal)]/30 bg-[color:var(--signal)]/10 px-5 py-8 text-center">
        <CheckCircle2
          className="mx-auto text-[color:var(--signal)]"
          size={28}
        />
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
          Recommendation received
        </h3>
        <p className="mt-2 text-sm text-[color:var(--mist)]">
          Thanks — we&apos;ll review it and add it to the catalog when we can.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-5 text-sm font-semibold text-[color:var(--signal)] hover:underline"
        >
          Recommend another song
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 sm:col-span-1">
          <span className="text-sm text-[color:var(--mist)]">Song title</span>
          <input
            name="title"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field"
            placeholder="e.g. Essence"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Artist</span>
          <input
            name="artist"
            required
            maxLength={120}
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="field"
            placeholder="e.g. Wizkid"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Genre (optional)</span>
          <select name="genre" defaultValue="" className="field">
            <option value="">Select a genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">
            Your email (optional)
          </span>
          <input
            type="email"
            name="email"
            maxLength={160}
            className="field"
            placeholder="So we can follow up"
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          Link (optional)
        </span>
        <input
          type="url"
          name="link"
          maxLength={500}
          className="field"
          placeholder="YouTube, Spotify, or SoundCloud URL"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Notes (optional)</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          className="field resize-y"
          placeholder="Why should we add it, album name, or anything useful…"
        />
      </label>

      {error && (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--signal)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Send size={16} />
        )}
        Send recommendation
      </button>
    </form>
  );
}
