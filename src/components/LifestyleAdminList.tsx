"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import type { LifestyleVideo } from "@/lib/lifestyle-types";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: string;
};

async function signUpload(kind: "lifestyle-video" | "lifestyle-cover") {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const signData = (await signRes.json()) as SignResponse & { error?: string };
  if (!signRes.ok) throw new Error(signData.error || "Could not sign upload");
  return signData;
}

async function uploadToCloudinary(file: File, signData: SignResponse) {
  const cloudFd = new FormData();
  cloudFd.append("file", file);
  cloudFd.append("api_key", signData.apiKey);
  cloudFd.append("timestamp", String(signData.timestamp));
  cloudFd.append("signature", signData.signature);
  cloudFd.append("folder", signData.folder);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType}/upload`,
    { method: "POST", body: cloudFd },
  );
  const cloudData = await cloudRes.json();
  if (!cloudRes.ok) {
    throw new Error(cloudData.error?.message || "Cloudinary upload failed");
  }
  return cloudData as { secure_url: string; public_id: string };
}

export function LifestyleAdminList({ videos }: { videos: LifestyleVideo[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<LifestyleVideo | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(video: LifestyleVideo) {
    if (!window.confirm(`Delete “${video.title}”? This cannot be undone.`)) {
      return;
    }
    setBusyId(video.id);
    try {
      const res = await fetch(`/api/lifestyle/${video.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    setError(null);
    setProgress("Saving…");

    const fd = new FormData(e.currentTarget);
    const videoFile = fd.get("video");
    const coverFile = fd.get("cover");
    const clearCover = fd.get("clearCover") === "on";

    try {
      const payload: Record<string, unknown> = {
        title: fd.get("title"),
        description: fd.get("description"),
      };

      if (videoFile instanceof File && videoFile.size > 0) {
        if (videoFile.size > 200 * 1024 * 1024) {
          throw new Error("Video must be under 200MB.");
        }
        setProgress("Uploading new video…");
        const sign = await signUpload("lifestyle-video");
        const uploaded = await uploadToCloudinary(videoFile, sign);
        payload.videoUrl = uploaded.secure_url;
        payload.videoPublicId = uploaded.public_id;
      }

      if (clearCover) {
        payload.clearCover = true;
      } else if (coverFile instanceof File && coverFile.size > 0) {
        if (coverFile.size > 10 * 1024 * 1024) {
          throw new Error("Cover must be under 10MB.");
        }
        setProgress("Uploading new cover…");
        const sign = await signUpload("lifestyle-cover");
        const uploaded = await uploadToCloudinary(coverFile, sign);
        payload.coverImageUrl = uploaded.secure_url;
        payload.coverPublicId = uploaded.public_id;
      }

      setProgress("Updating…");
      const res = await fetch(`/api/lifestyle/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setEditing(null);
      setProgress(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setProgress(null);
    } finally {
      setBusyId(null);
    }
  }

  if (videos.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-[color:var(--mist)]">
        No lifestyle videos yet. Publish one above.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        {videos.map((video) => (
          <li
            key={video.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-display)] font-semibold text-[color:var(--foam)]">
                {video.title}
              </p>
              <p className="truncate text-sm text-[color:var(--mist)]">
                {video.description || "No description"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/lifestyle/${video.id}`}
                className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--foam)] hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEditing(video);
                  setError(null);
                  setProgress(null);
                }}
                className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--foam)] hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                disabled={busyId === video.id}
                onClick={() => onDelete(video)}
                className="inline-flex items-center gap-2 rounded-sm border border-[color:var(--ember)]/40 px-3 py-2 text-xs font-semibold text-[color:var(--ember)] hover:bg-[color:var(--ember)]/10 disabled:opacity-60"
              >
                {busyId === video.id && !editing ? (
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

      {editing ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <form
            onSubmit={onSaveEdit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-[color:var(--ink)] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
                Edit lifestyle video
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-sm p-1 text-[color:var(--mist)] hover:text-[color:var(--foam)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm text-[color:var(--mist)]">Title</span>
                <input
                  name="title"
                  required
                  defaultValue={editing.title}
                  className="field"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[color:var(--mist)]">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editing.description}
                  className="field resize-y"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[color:var(--mist)]">
                  Replace video (optional)
                </span>
                <input
                  type="file"
                  name="video"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="block w-full text-sm text-[color:var(--foam)] file:mr-3 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-[color:var(--mist)]">
                  Replace cover (optional)
                </span>
                <input
                  type="file"
                  name="cover"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="block w-full text-sm text-[color:var(--foam)] file:mr-3 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                />
              </label>
              {editing.coverImageUrl ? (
                <label className="flex items-center gap-2 text-sm text-[color:var(--mist)]">
                  <input type="checkbox" name="clearCover" className="rounded-sm" />
                  Remove cover image
                </label>
              ) : null}
            </div>

            {progress && !error ? (
              <p className="mt-3 text-sm text-[color:var(--signal)]">{progress}</p>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busyId === editing.id}
                className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] disabled:opacity-60"
              >
                {busyId === editing.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-[color:var(--mist)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
