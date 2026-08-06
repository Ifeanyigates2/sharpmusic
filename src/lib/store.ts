import { SEED_TRACKS } from "@/data/tracks";
import {
  destroyCloudinaryAsset,
  isCloudinaryConfigured,
  uploadAudioToCloudinary,
} from "@/lib/cloudinary";
import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import type { Track, TrackInput } from "@/lib/types";
import { MIN_PRICE_CENTS } from "@/lib/types";
import { HiddenTrackModel } from "@/models/HiddenTrack";
import { TrackModel } from "@/models/Track";

type StoredTrack = Track & {
  cloudinaryPublicId?: string;
  coverPublicId?: string;
};

function toTrack(doc: {
  id: string;
  title: string;
  artist: string;
  genre: string;
  region: string;
  country: string;
  durationSec: number;
  pricing: "free" | "paid";
  priceCents: number;
  currency: string;
  audioUrl: string;
  coverImageUrl?: string;
  coverHue: number;
  downloads: number;
  description: string;
  license: string;
  createdAt: string;
  cloudinaryPublicId?: string;
  coverPublicId?: string;
}): StoredTrack {
  return {
    id: doc.id,
    title: doc.title,
    artist: doc.artist,
    genre: doc.genre,
    region: doc.region,
    country: doc.country,
    durationSec: doc.durationSec,
    pricing: doc.pricing,
    priceCents: doc.priceCents,
    currency: doc.currency,
    audioUrl: doc.audioUrl,
    coverImageUrl: doc.coverImageUrl || "",
    coverHue: doc.coverHue,
    downloads: doc.downloads,
    description: doc.description,
    license: doc.license,
    createdAt: doc.createdAt,
    cloudinaryPublicId: doc.cloudinaryPublicId || "",
    coverPublicId: doc.coverPublicId || "",
  };
}

async function getHiddenIds(): Promise<Set<string>> {
  if (!isMongoConfigured()) return new Set();
  try {
    await connectMongo();
    const rows = await HiddenTrackModel.find().lean();
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

async function readUploadedTracks(): Promise<StoredTrack[]> {
  if (!isMongoConfigured()) return [];
  try {
    await connectMongo();
    const docs = await TrackModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc) => toTrack(doc as StoredTrack));
  } catch (error) {
    console.error("Failed to load tracks from MongoDB", error);
    return [];
  }
}

export async function getAllTracks(): Promise<Track[]> {
  const [uploaded, hidden] = await Promise.all([
    readUploadedTracks(),
    getHiddenIds(),
  ]);
  const byId = new Map<string, Track>();
  for (const t of SEED_TRACKS) {
    if (!hidden.has(t.id)) byId.set(t.id, t);
  }
  for (const t of uploaded) {
    if (!hidden.has(t.id)) byId.set(t.id, t);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const byDate = +new Date(b.createdAt) - +new Date(a.createdAt);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });
}

/** All catalog tracks for admin management (includes source flag). */
export async function getAdminTracks(): Promise<
  Array<Track & { source: "uploaded" | "demo" }>
> {
  const [uploaded, hidden] = await Promise.all([
    readUploadedTracks(),
    getHiddenIds(),
  ]);
  const uploadedIds = new Set(uploaded.map((t) => t.id));
  const items: Array<Track & { source: "uploaded" | "demo" }> = [];

  for (const t of uploaded) {
    if (!hidden.has(t.id)) items.push({ ...t, source: "uploaded" });
  }
  for (const t of SEED_TRACKS) {
    if (!hidden.has(t.id) && !uploadedIds.has(t.id)) {
      items.push({ ...t, source: "demo" });
    }
  }

  return items.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export async function getTrackById(id: string): Promise<Track | undefined> {
  const hidden = await getHiddenIds();
  if (hidden.has(id)) return undefined;

  if (isMongoConfigured()) {
    try {
      await connectMongo();
      const doc = await TrackModel.findOne({ id }).lean();
      if (doc) return toTrack(doc as StoredTrack);
    } catch (error) {
      console.error("Failed to load track", error);
    }
  }
  return SEED_TRACKS.find((t) => t.id === id);
}

export async function searchTracks(params: {
  q?: string;
  genre?: string;
  region?: string;
  pricing?: string;
}): Promise<Track[]> {
  const { q = "", genre = "", region = "", pricing = "" } = params;
  const query = q.trim().toLowerCase();

  return (await getAllTracks()).filter((t) => {
    if (genre && t.genre !== genre) return false;
    if (region && t.region !== region) return false;
    if (pricing === "free" && t.pricing !== "free") return false;
    if (pricing === "paid" && t.pricing !== "paid") return false;
    if (!query) return true;
    const hay = `${t.title} ${t.artist} ${t.genre} ${t.country} ${t.region}`.toLowerCase();
    return hay.includes(query);
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function buildTrack(
  id: string,
  input: TrackInput,
  audioUrl: string,
  extras?: {
    durationSec?: number;
    cloudinaryPublicId?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
    downloads?: number;
    createdAt?: string;
    coverHue?: number;
  },
): Track {
  const hue =
    extras?.coverHue ??
    [...input.title].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return {
    id,
    title: input.title.trim(),
    artist: input.artist.trim(),
    genre: input.genre,
    region: input.region,
    country: input.country.trim() || "Worldwide",
    durationSec: extras?.durationSec || 180,
    pricing: input.pricing,
    priceCents: input.pricing === "free" ? 0 : Math.max(MIN_PRICE_CENTS, input.priceCents),
    currency: "USD",
    audioUrl,
    coverImageUrl: extras?.coverImageUrl || "",
    coverHue: hue,
    downloads: extras?.downloads ?? 0,
    description:
      input.description.trim() || "Newly uploaded on sharpmusic.com.",
    license:
      input.license.trim() ||
      (input.pricing === "free"
        ? "Artist Shared — Free Download"
        : "Commercial License included"),
    createdAt: extras?.createdAt || new Date().toISOString(),
  };
}

export async function saveTrack(
  track: Track,
  cloudinaryPublicId = "",
  coverPublicId = "",
): Promise<Track> {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is required to save uploaded tracks");
  }

  await connectMongo();
  await TrackModel.findOneAndUpdate(
    { id: track.id },
    { ...track, cloudinaryPublicId, coverPublicId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await HiddenTrackModel.deleteOne({ id: track.id });
  return track;
}

export async function addUploadedTrack(
  input: TrackInput,
  file: File,
): Promise<Track> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  const id = `trk_${slugify(input.title)}_${Date.now().toString(36)}`;
  const uploaded = await uploadAudioToCloudinary(file, id);
  const track = buildTrack(id, input, uploaded.url, {
    durationSec: uploaded.durationSec,
    cloudinaryPublicId: uploaded.publicId,
  });
  return saveTrack(track, uploaded.publicId);
}

export async function addUploadedTrackFromCloudinary(
  input: TrackInput,
  audio: {
    url: string;
    durationSec?: number;
    publicId?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
  },
): Promise<Track> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  const id = `trk_${slugify(input.title)}_${Date.now().toString(36)}`;
  const track = buildTrack(id, input, audio.url, {
    durationSec: audio.durationSec,
    cloudinaryPublicId: audio.publicId,
    coverImageUrl: audio.coverImageUrl,
    coverPublicId: audio.coverPublicId,
  });
  return saveTrack(track, audio.publicId || "", audio.coverPublicId || "");
}

export async function updateTrackFromAdmin(
  id: string,
  input: TrackInput,
  media?: {
    audioUrl?: string;
    durationSec?: number;
    publicId?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
  },
): Promise<Track> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  await connectMongo();
  const existingDoc = await TrackModel.findOne({ id }).lean();
  const existing = existingDoc
    ? toTrack(existingDoc as StoredTrack)
    : SEED_TRACKS.find((t) => t.id === id);

  if (!existing) {
    throw new Error("Track not found");
  }

  const stored = existingDoc
    ? toTrack(existingDoc as StoredTrack)
    : undefined;

  let audioUrl = existing.audioUrl;
  let durationSec = existing.durationSec;
  let cloudinaryPublicId = stored?.cloudinaryPublicId || "";
  let coverImageUrl = existing.coverImageUrl || "";
  let coverPublicId = stored?.coverPublicId || "";

  if (media?.audioUrl) {
    if (cloudinaryPublicId) {
      await destroyCloudinaryAsset(cloudinaryPublicId, "video");
    }
    audioUrl = media.audioUrl;
    durationSec = media.durationSec || durationSec;
    cloudinaryPublicId = media.publicId || "";
  }

  if (media?.coverImageUrl) {
    if (coverPublicId) {
      await destroyCloudinaryAsset(coverPublicId, "image");
    }
    coverImageUrl = media.coverImageUrl;
    coverPublicId = media.coverPublicId || "";
  }

  const track = buildTrack(id, input, audioUrl, {
    durationSec,
    coverImageUrl,
    downloads: existing.downloads,
    createdAt: existing.createdAt,
    coverHue: existing.coverHue,
  });

  return saveTrack(track, cloudinaryPublicId, coverPublicId);
}

export async function deleteTrackById(id: string): Promise<void> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  await connectMongo();
  const existingDoc = await TrackModel.findOne({ id }).lean();
  const isSeed = SEED_TRACKS.some((t) => t.id === id);

  if (!existingDoc && !isSeed) {
    throw new Error("Track not found");
  }

  if (existingDoc) {
    const stored = toTrack(existingDoc as StoredTrack);
    if (stored.cloudinaryPublicId) {
      await destroyCloudinaryAsset(stored.cloudinaryPublicId, "video");
    }
    if (stored.coverPublicId) {
      await destroyCloudinaryAsset(stored.coverPublicId, "image");
    }
    await TrackModel.deleteOne({ id });
  }

  if (isSeed) {
    await HiddenTrackModel.findOneAndUpdate(
      { id },
      { id },
      { upsert: true },
    );
  }
}
