"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, X } from "lucide-react";

export function PlaylistTrackActions({
  playlistId,
  trackId,
}: {
  playlistId: string;
  trackId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/playlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          trackId,
          action: "remove",
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-1 rounded-sm border border-white/10 px-2 py-1.5 text-[11px] font-semibold text-[color:var(--mist)] transition hover:border-[color:var(--ember)]/40 hover:text-[color:var(--ember)] disabled:opacity-60"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
      Remove
    </button>
  );
}
