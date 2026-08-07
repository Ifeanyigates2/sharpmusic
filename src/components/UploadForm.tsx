"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { GENRES, REGIONS } from "@/lib/types";
import { DEFAULT_PRICE_CENTS, MIN_PRICE_CENTS } from "@/lib/types";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: string;
};

async function signUpload(kind: "audio" | "image") {
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

export function UploadForm() {
  const router = useRouter();
  const [pricing, setPricing] = useState<"free" | "paid">("free");
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
    const file = fd.get("audio");
    const cover = fd.get("cover");

    if (!(file instanceof File) || file.size === 0) {
      setError("Audio file is required.");
      setBusy(false);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Audio file must be under 100MB.");
      setBusy(false);
      return;
    }
    if (cover instanceof File && cover.size > 10 * 1024 * 1024) {
      setError("Cover image must be under 10MB.");
      setBusy(false);
      return;
    }

    try {
      setProgress("Uploading audio to Cloudinary…");
      const audioSign = await signUpload("audio");
      const audioData = await uploadToCloudinary(file, audioSign);

      let coverImageUrl = "";
      let coverPublicId = "";
      if (cover instanceof File && cover.size > 0) {
        setProgress("Uploading cover image…");
        const imageSign = await signUpload("image");
        const imageData = await uploadToCloudinary(cover, imageSign);
        coverImageUrl = imageData.secure_url;
        coverPublicId = imageData.public_id;
      }

      setProgress("Saving track…");
      const saveRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          artist: fd.get("artist"),
          genre: fd.get("genre"),
          region: fd.get("region"),
          country: fd.get("country"),
          pricing: fd.get("pricing"),
          priceCents: Math.round(Number(fd.get("price") || 0) * 100),
          description: fd.get("description"),
          license: fd.get("license"),
          audioUrl: audioData.secure_url,
          durationSec: Math.round(audioData.duration || 180),
          publicId: audioData.public_id,
          coverImageUrl,
          coverPublicId,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

      router.push(`/track/${saveData.track.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          Audio file (MP3, WAV, up to 100MB)
        </span>
        <input
          required
          type="file"
          name="audio"
          accept="audio/*,video/mp4,.mp3,.wav,.m4a,.aac,.flac"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-8 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-[color:var(--signal)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--ink)]"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[color:var(--mist)]">
          Cover picture (JPG, PNG, WebP — up to 10MB)
        </span>
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="block w-full rounded-sm border border-dashed border-white/20 bg-white/[0.03] px-4 py-6 text-sm text-[color:var(--foam)] file:mr-4 file:rounded-sm file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[color:var(--foam)]"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" required placeholder="Track title" />
        <Field label="Artist" name="artist" required placeholder="Artist name" />
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Genre</span>
          <select name="genre" required defaultValue={GENRES[0]} className="field">
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-[color:var(--mist)]">Region</span>
          <select name="region" required defaultValue={REGIONS[0]} className="field">
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <Field label="Country" name="country" placeholder="e.g. Nigeria" />
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
            defaultValue={(DEFAULT_PRICE_CENTS / 100).toFixed(2)}
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
          placeholder="Tell listeners what this track is about"
          className="field resize-y"
        />
      </label>

      <Field
        label="License"
        name="license"
        placeholder="Artist Shared — Free Download"
      />

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
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
        Publish track
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
