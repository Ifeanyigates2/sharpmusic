"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { GENRES, REGIONS, type Track } from "@/lib/types";
import { DEFAULT_PRICE_CENTS, MIN_PRICE_CENTS } from "@/lib/types";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: string;
};

async function signUpload(kind: "audio" | "image" | "music-video") {
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
    duration?: number;
  };
}

export function AdminEditForm({ track }: { track: Track }) {
  const router = useRouter();
  const [pricing, setPricing] = useState<"free" | "paid">(track.pricing);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasVideo = Boolean(track.videoUrl?.trim());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setProgress("Saving changes…");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const audio = fd.get("audio");
    const cover = fd.get("cover");
    const video = fd.get("video");
    const clearVideo = fd.get("clearVideo") === "on";

    try {
      const payload: Record<string, unknown> = {
        title: fd.get("title"),
        artist: fd.get("artist"),
        genre: fd.get("genre"),
        region: fd.get("region"),
        country: fd.get("country"),
        pricing: fd.get("pricing"),
        priceCents: Math.round(Number(fd.get("price") || 0) * 100),
        description: fd.get("description"),
        license: fd.get("license"),
      };

      if (audio instanceof File && audio.size > 0) {
        if (audio.size > 100 * 1024 * 1024) {
          throw new Error("Audio file must be under 100MB.");
        }
        setProgress("Uploading new audio…");
        const sign = await signUpload("audio");
        const uploaded = await uploadToCloudinary(audio, sign);
        payload.audioUrl = uploaded.secure_url;
        payload.durationSec = Math.round(uploaded.duration || track.durationSec);
        payload.publicId = uploaded.public_id;
      }

      if (cover instanceof File && cover.size > 0) {
        if (cover.size > 10 * 1024 * 1024) {
          throw new Error("Cover image must be under 10MB.");
        }
        setProgress("Uploading new cover…");
        const sign = await signUpload("image");
        const uploaded = await uploadToCloudinary(cover, sign);
        payload.coverImageUrl = uploaded.secure_url;
        payload.coverPublicId = uploaded.public_id;
      }

      if (clearVideo) {
        payload.clearVideo = true;
      } else if (video instanceof File && video.size > 0) {
        if (video.size > 200 * 1024 * 1024) {
          throw new Error("Music video must be under 200MB.");
        }
        setProgress("Uploading music video…");
        const sign = await signUpload("music-video");
        const uploaded = await uploadToCloudinary(video, sign);
        payload.videoUrl = uploaded.secure_url;
        payload.videoPublicId = uploaded.public_id;
      }

      setProgress("Updating track…");
      const res = await fetch(`/api/tracks/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      router.push("/admin/tracks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-md">
          <CoverArt track={track} sizes="80px" />
        </div>
        <p className="text-sm text-[color:var(--mist)]">
          Leave audio/cover/video empty to keep the current files.
          {hasVideo ? " This track already has a music video." : ""}
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Replace audio (optional)</span>
        <input
          type="file"
          name="audio"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-[color:var(--signal)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--ink)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Replace cover (optional)</span>
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--foam)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          {hasVideo ? "Replace music video (optional)" : "Add music video (optional)"}
        </span>
        <input
          type="file"
          name="video"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-5 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--foam)]"
        />
      </label>

      {hasVideo ? (
        <label className="flex items-center gap-2 text-sm text-[color:var(--mist)]">
          <input type="checkbox" name="clearVideo" className="rounded-sm" />
          Remove music video
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" required defaultValue={track.title} />
        <Field label="Artist" name="artist" required defaultValue={track.artist} />
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Genre</span>
          <select name="genre" required defaultValue={track.genre} className="field">
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Region</span>
          <select name="region" required defaultValue={track.region} className="field">
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <Field label="Country" name="country" defaultValue={track.country} />
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Pricing</span>
          <select
            name="pricing"
            value={pricing}
            onChange={(e) => setPricing(e.target.value as "free" | "paid")}
            className="field"
          >
            <option value="free">Free download</option>
            <option value="paid">Paid download</option>
          </select>
        </label>
      </div>

      {pricing === "paid" && (
        <>
          <Field
            label="Price (USD)"
            name="price"
            type="number"
            defaultValue={(
              (track.priceCents >= MIN_PRICE_CENTS
                ? track.priceCents
                : DEFAULT_PRICE_CENTS) / 100
            ).toFixed(2)}
            min={MIN_PRICE_CENTS / 100}
            step="0.01"
          />
          <p className="-mt-3 text-xs text-[color:var(--mist)]">
            Minimum $0.50
          </p>
        </>
      )}

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={track.description}
          className="field resize-y"
        />
      </label>

      <Field label="License" name="license" defaultValue={track.license} />

      {progress && !error && (
        <p className="text-sm text-[color:var(--signal)]">{progress}</p>
      )}
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
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
        Save changes
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-[color:var(--mist)]">{label}</span>
      <input name={name} className="field" {...props} />
    </label>
  );
}
