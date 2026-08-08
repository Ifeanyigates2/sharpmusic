"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

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
  return cloudData as {
    secure_url: string;
    public_id: string;
  };
}

export function LifestyleUploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setProgress("Preparing upload…");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const video = fd.get("video");
    const cover = fd.get("cover");

    if (!(video instanceof File) || video.size === 0) {
      setError("Video file is required.");
      setBusy(false);
      return;
    }
    if (video.size > 200 * 1024 * 1024) {
      setError("Video must be under 200MB.");
      setBusy(false);
      return;
    }
    if (cover instanceof File && cover.size > 10 * 1024 * 1024) {
      setError("Cover image must be under 10MB.");
      setBusy(false);
      return;
    }

    try {
      setProgress("Uploading lifestyle video…");
      const videoSign = await signUpload("lifestyle-video");
      const videoData = await uploadToCloudinary(video, videoSign);

      let coverImageUrl = "";
      let coverPublicId = "";
      if (cover instanceof File && cover.size > 0) {
        setProgress("Uploading cover…");
        const coverSign = await signUpload("lifestyle-cover");
        const coverData = await uploadToCloudinary(cover, coverSign);
        coverImageUrl = coverData.secure_url;
        coverPublicId = coverData.public_id;
      }

      setProgress("Saving…");
      const saveRes = await fetch("/api/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          description: fd.get("description"),
          videoUrl: videoData.secure_url,
          videoPublicId: videoData.public_id,
          coverImageUrl,
          coverPublicId,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

      form.reset();
      router.refresh();
      setProgress(null);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5"
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
        Publish lifestyle video
      </h2>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          Video (MP4, WebM, MOV — up to 200MB)
        </span>
        <input
          required
          type="file"
          name="video"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-[color:var(--signal)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--ink)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          Cover image (optional)
        </span>
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--foam)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Title</span>
        <input name="title" required className="field" placeholder="Video title" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Description</span>
        <textarea
          name="description"
          rows={3}
          className="field resize-y"
          placeholder="What’s this lifestyle video about?"
        />
      </label>

      {progress && !error ? (
        <p className="text-sm text-[color:var(--signal)]">{progress}</p>
      ) : null}
      {error ? (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--signal)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Upload size={16} />
        )}
        Publish
      </button>
    </form>
  );
}
