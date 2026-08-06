"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/tracks";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace(next.startsWith("/") ? next : "/admin/tracks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="field"
          placeholder="admin@sharpmusic.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="Enter password"
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
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
        Sign in
      </button>
    </form>
  );
}
