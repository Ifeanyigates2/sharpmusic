"use client";

import { useState } from "react";
import { Download, Loader2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Track } from "@/lib/types";

export function DownloadButton({
  track,
  initiallyOwned = false,
}: {
  track: Track;
  initiallyOwned?: boolean;
}) {
  const [owned, setOwned] = useState(initiallyOwned || track.pricing === "free");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setOwned(true);
      setMessage(data.message ?? "Purchase unlocked.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/download/${track.id}`);
      if (res.status === 402) {
        setOwned(false);
        setMessage("Purchase required before download.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${track.artist} - ${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  if (!owned && track.pricing === "paid") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={buy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[color:var(--ember)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <ShoppingBag size={16} />}
          Buy {formatPrice(track.priceCents, track.currency)}
        </button>
        {message && <p className="text-sm text-[color:var(--mist)]">{message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={download}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[color:var(--signal)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
        Download MP3
      </button>
      {message && <p className="text-sm text-[color:var(--mist)]">{message}</p>}
    </div>
  );
}
