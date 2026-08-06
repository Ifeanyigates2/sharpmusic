import { SEED_TRACKS } from "@/data/tracks";
import { uploadAudioToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import type { Track, TrackInput } from "@/lib/types";
import { TrackModel } from "@/models/Track";

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
  coverHue: number;
  downloads: number;
  description: string;
  license: string;
  createdAt: string;
}): Track {
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
    coverHue: doc.coverHue,
    downloads: doc.downloads,
    description: doc.description,
    license: doc.license,
    createdAt: doc.createdAt,
  };
}

async function readUploadedTracks(): Promise<Track[]> {
  if (!isMongoConfigured()) return [];
  try {
    await connectMongo();
    const docs = await TrackModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc) => toTrack(doc as Track));
  } catch (error) {
    console.error("Failed to load tracks from MongoDB", error);
    return [];
  }
}

export async function getAllTracks(): Promise<Track[]> {
  const uploaded = await readUploadedTracks();
  const byId = new Map<string, Track>();
  for (const t of SEED_TRACKS) byId.set(t.id, t);
  for (const t of uploaded) byId.set(t.id, t);
  return Array.from(byId.values()).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export async function getTrackById(id: string): Promise<Track | undefined> {
  if (isMongoConfigured()) {
    try {
      await connectMongo();
      const doc = await TrackModel.findOne({ id }).lean();
      if (doc) return toTrack(doc as Track);
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
  extras?: { durationSec?: number; cloudinaryPublicId?: string },
): Track {
  const hue =
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
    priceCents: input.pricing === "free" ? 0 : Math.max(99, input.priceCents),
    currency: "USD",
    audioUrl,
    coverHue: hue,
    downloads: 0,
    description:
      input.description.trim() || "Newly uploaded on sharpmusic.com.",
    license:
      input.license.trim() ||
      (input.pricing === "free"
        ? "Artist Shared — Free Download"
        : "Commercial License included"),
    createdAt: new Date().toISOString(),
  };
}

export async function saveTrack(
  track: Track,
  cloudinaryPublicId = "",
): Promise<Track> {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is required to save uploaded tracks");
  }

  await connectMongo();
  await TrackModel.findOneAndUpdate(
    { id: track.id },
    { ...track, cloudinaryPublicId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
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
  audio: { url: string; durationSec?: number; publicId?: string },
): Promise<Track> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  const id = `trk_${slugify(input.title)}_${Date.now().toString(36)}`;
  const track = buildTrack(id, input, audio.url, {
    durationSec: audio.durationSec,
    cloudinaryPublicId: audio.publicId,
  });
  return saveTrack(track, audio.publicId || "");
}
