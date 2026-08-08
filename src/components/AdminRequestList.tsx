"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { SongRequest, SongRequestStatus } from "@/lib/request-types";
import { SONG_REQUEST_STATUSES } from "@/lib/request-types";

const STATUS_LABEL: Record<SongRequestStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  added: "Added",
  declined: "Declined",
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminRequestList({ requests }: { requests: SongRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: SongRequestStatus) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(req: SongRequest) {
    const ok = window.confirm(
      `Delete request for “${req.title}” by ${req.artist}?`,
    );
    if (!ok) return;

    setBusyId(req.id);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${req.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-[color:var(--mist)]">
        No song recommendations yet.
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

      <ul className="space-y-4">
        {requests.map((req) => (
          <li
            key={req.id}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-4 md:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
                    {req.title}
                  </p>
                  <p className="text-sm text-[color:var(--mist)]">
                    {req.artist}
                    {req.genre ? ` · ${req.genre}` : ""}
                  </p>
                </div>
                {req.link && (
                  <a
                    href={req.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-[color:var(--signal)] hover:underline"
                  >
                    {req.link}
                  </a>
                )}
                {req.notes && (
                  <p className="text-sm leading-relaxed text-[color:var(--foam)]/90">
                    {req.notes}
                  </p>
                )}
                <p className="text-xs text-[color:var(--mist)]">
                  {formatWhen(req.createdAt)}
                  {req.email ? ` · ${req.email}` : ""}
                  {" · "}
                  {STATUS_LABEL[req.status]}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`status-${req.id}`}>
                  Status
                </label>
                <select
                  id={`status-${req.id}`}
                  value={req.status}
                  disabled={busyId === req.id}
                  onChange={(e) =>
                    setStatus(req.id, e.target.value as SongRequestStatus)
                  }
                  className="rounded-sm border border-white/15 bg-[color:var(--ink)] px-3 py-2 text-xs font-semibold text-[color:var(--foam)] outline-none focus:ring-1 focus:ring-[color:var(--signal)] disabled:opacity-60"
                >
                  {SONG_REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyId === req.id}
                  onClick={() => onDelete(req)}
                  className="inline-flex items-center gap-2 rounded-sm border border-[color:var(--ember)]/40 px-3 py-2 text-xs font-semibold text-[color:var(--ember)] transition hover:bg-[color:var(--ember)]/10 disabled:opacity-60"
                >
                  {busyId === req.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
