"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({
  trackId,
  initiallyFavorited = false,
  size = "md",
  className = "",
}: {
  trackId: string;
  initiallyFavorited?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFavorited(initiallyFavorited);
  }, [initiallyFavorited, trackId]);

  async function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update favorite");
      setFavorited(Boolean(data.favorited));
      router.refresh();
    } catch {
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  }

  const icon = size === "sm" ? 14 : 16;
  const pad = size === "sm" ? "p-1.5" : "px-5 py-3";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`inline-flex items-center gap-2 rounded-sm border text-sm font-semibold transition disabled:opacity-60 ${pad} ${
        favorited
          ? "border-[color:var(--ember)]/50 bg-[color:var(--ember)]/15 text-[color:var(--ember)]"
          : "border-white/20 bg-black/35 text-[color:var(--foam)] backdrop-blur-sm hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
      } ${className}`}
    >
      <Heart size={icon} fill={favorited ? "currentColor" : "none"} />
      {size === "md" ? (favorited ? "Saved" : "Save") : null}
    </button>
  );
}
