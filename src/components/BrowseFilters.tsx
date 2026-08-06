"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffectEvent, useTransition } from "react";
import { Search } from "lucide-react";
import { GENRES, REGIONS } from "@/lib/types";

export function BrowseFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useEffectEvent((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`/browse?${next.toString()}`);
    });
  });

  return (
    <form
      className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        update("q", String(fd.get("q") ?? ""));
      }}
    >
      <label className="relative block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--mist)]"
        />
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search title, artist, country…"
          className="w-full rounded-sm border border-white/10 bg-[color:var(--ink)] py-2.5 pl-10 pr-3 text-sm text-[color:var(--foam)] outline-none ring-[color:var(--signal)] placeholder:text-[color:var(--mist)] focus:ring-1"
        />
      </label>

      <select
        value={params.get("genre") ?? ""}
        onChange={(e) => update("genre", e.target.value)}
        className="rounded-sm border border-white/10 bg-[color:var(--ink)] px-3 py-2.5 text-sm text-[color:var(--foam)] outline-none focus:ring-1 focus:ring-[color:var(--signal)]"
        aria-label="Genre"
      >
        <option value="">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={params.get("region") ?? ""}
        onChange={(e) => update("region", e.target.value)}
        className="rounded-sm border border-white/10 bg-[color:var(--ink)] px-3 py-2.5 text-sm text-[color:var(--foam)] outline-none focus:ring-1 focus:ring-[color:var(--signal)]"
        aria-label="Region"
      >
        <option value="">All regions</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        value={params.get("pricing") ?? ""}
        onChange={(e) => update("pricing", e.target.value)}
        className="rounded-sm border border-white/10 bg-[color:var(--ink)] px-3 py-2.5 text-sm text-[color:var(--foam)] outline-none focus:ring-1 focus:ring-[color:var(--signal)]"
        aria-label="Pricing"
      >
        <option value="">Free & paid</option>
        <option value="free">Free only</option>
        <option value="paid">Paid only</option>
      </select>

      <p className="sr-only" aria-live="polite">
        {pending ? "Updating results" : "Results updated"}
      </p>
    </form>
  );
}
