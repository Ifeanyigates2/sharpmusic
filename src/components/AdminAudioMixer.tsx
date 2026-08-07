"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Sparkles, Wand2 } from "lucide-react";
import {
  MIX_PRESETS,
  audioBufferToWavBlob,
  decodeAudioUrl,
  enhanceAudioBuffer,
  getMixPreset,
  type MixPresetId,
} from "@/lib/audio-enhance";
import type { Track } from "@/lib/types";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: string;
};

async function signUpload() {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "audio" }),
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

export function AdminAudioMixer({
  track,
  onSaved,
}: {
  track: Track;
  onSaved?: () => void;
}) {
  const [presetId, setPresetId] = useState<MixPresetId>("balanced");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"original" | "enhanced">("enhanced");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const originalRef = useRef<AudioBuffer | null>(null);
  const enhancedRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setStatus("Loading audio…");
    setError(null);

    void (async () => {
      try {
        const buffer = await decodeAudioUrl(`/api/tracks/${track.id}/audio`);
        if (cancelled) return;
        originalRef.current = buffer;
        enhancedRef.current = null;
        setReady(true);
        setStatus(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
          setStatus(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id, track.audioUrl]);

  function stopPreview() {
    try {
      sourceRef.current?.stop();
    } catch {
      // already stopped
    }
    sourceRef.current = null;
    setPlaying(false);
  }

  async function ensureEnhanced() {
    if (!originalRef.current) throw new Error("Audio not loaded");
    const preset = getMixPreset(presetId);
    setStatus(`Mixing with “${preset.label}”…`);
    const enhanced = await enhanceAudioBuffer(originalRef.current, preset);
    enhancedRef.current = enhanced;
    setStatus(null);
    return enhanced;
  }

  async function preview() {
    setError(null);
    stopPreview();

    try {
      setBusy(true);
      const buffer =
        mode === "original"
          ? originalRef.current
          : await ensureEnhanced();
      if (!buffer) throw new Error("Audio not ready");

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setPlaying(false);
      source.start(0);
      sourceRef.current = source;
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyMix() {
    setError(null);
    stopPreview();
    setBusy(true);

    try {
      setStatus("Rendering enhanced mix…");
      const enhanced = await ensureEnhanced();
      const blob = audioBufferToWavBlob(enhanced);
      const file = new File(
        [blob],
        `${track.id}-${presetId}-enhanced.wav`,
        { type: "audio/wav" },
      );

      setStatus("Uploading mix…");
      const sign = await signUpload();
      const uploaded = await uploadToCloudinary(file, sign);

      setStatus("Saving track…");
      const res = await fetch(`/api/tracks/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          region: track.region,
          country: track.country,
          pricing: track.pricing,
          priceCents: track.priceCents,
          description: track.description,
          license: track.license,
          audioUrl: uploaded.secure_url,
          durationSec: Math.round(uploaded.duration || track.durationSec),
          publicId: uploaded.public_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setStatus("Mix saved to this track.");
      originalRef.current = enhanced;
      enhancedRef.current = null;
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mix failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-sm bg-[color:var(--signal)]/15 p-2 text-[color:var(--signal)]">
          <Wand2 size={18} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
            Mix & enhance
          </h2>
          <p className="mt-1 text-sm text-[color:var(--mist)]">
            Improve how this track sounds with EQ, compression, and leveling —
            then preview and save over the uploaded file.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MIX_PRESETS.map((preset) => {
          const active = presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => {
                setPresetId(preset.id);
                enhancedRef.current = null;
                stopPreview();
              }}
              className={`rounded-sm border px-3 py-3 text-left transition ${
                active
                  ? "border-[color:var(--signal)] bg-[color:var(--signal)]/10"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <p className="text-sm font-semibold text-[color:var(--foam)]">
                {preset.label}
              </p>
              <p className="mt-1 text-xs text-[color:var(--mist)]">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => setMode("original")}
          className={`rounded-sm px-3 py-2 text-xs font-semibold transition ${
            mode === "original"
              ? "bg-white/15 text-[color:var(--foam)]"
              : "border border-white/15 text-[color:var(--mist)]"
          }`}
        >
          Original
        </button>
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => setMode("enhanced")}
          className={`rounded-sm px-3 py-2 text-xs font-semibold transition ${
            mode === "enhanced"
              ? "bg-white/15 text-[color:var(--foam)]"
              : "border border-white/15 text-[color:var(--mist)]"
          }`}
        >
          Enhanced
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => (playing ? stopPreview() : void preview())}
          className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)] disabled:opacity-60"
        >
          {busy && !status?.includes("Uploading") && !status?.includes("Saving") ? (
            <Loader2 size={16} className="animate-spin" />
          ) : playing ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
          {playing ? "Stop preview" : "Preview"}
        </button>

        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => void applyMix()}
          className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Apply mix to track
        </button>
      </div>

      {status && (
        <p className="text-sm text-[color:var(--signal)]">{status}</p>
      )}
      {error && (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-3 py-2 text-sm text-[color:var(--foam)]">
          {error}
        </p>
      )}
    </div>
  );
}
