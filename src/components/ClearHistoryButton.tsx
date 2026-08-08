"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function ClearHistoryButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    if (busy) return;
    const ok = window.confirm("Clear your recently played history on this device?");
    if (!ok) return;
    setBusy(true);
    try {
      await fetch("/api/history", { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={clear}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--mist)] transition hover:text-[color:var(--foam)] disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      Clear history
    </button>
  );
}
