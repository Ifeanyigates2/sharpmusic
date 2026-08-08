import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { SongRequestModel } from "@/models/SongRequest";
import type {
  SongRequest,
  SongRequestInput,
  SongRequestStatus,
} from "@/lib/request-types";
import { SONG_REQUEST_STATUSES } from "@/lib/request-types";

function toRequest(doc: {
  id: string;
  title: string;
  artist: string;
  genre?: string | null;
  link?: string | null;
  notes?: string | null;
  email?: string | null;
  status: SongRequestStatus;
  createdAt: string;
  updatedAt: string;
}): SongRequest {
  return {
    id: doc.id,
    title: doc.title,
    artist: doc.artist,
    genre: doc.genre || "",
    link: doc.link || "",
    notes: doc.notes || "",
    email: doc.email || "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function normalizeSongRequestInput(
  input: SongRequestInput,
): SongRequestInput | { error: string } {
  const title = String(input.title ?? "").trim();
  const artist = String(input.artist ?? "").trim();
  const genre = String(input.genre ?? "").trim();
  const link = String(input.link ?? "").trim();
  const notes = String(input.notes ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();

  if (!title || !artist) {
    return { error: "Song title and artist are required." };
  }
  if (title.length > 160) return { error: "Title is too long." };
  if (artist.length > 120) return { error: "Artist name is too long." };
  if (genre.length > 60) return { error: "Genre is too long." };
  if (link.length > 500) return { error: "Link is too long." };
  if (notes.length > 1000) return { error: "Notes are too long." };
  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Enter a valid email, or leave it blank." };
  }
  if (link) {
    try {
      const url = new URL(link);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { error: "Link must start with http:// or https://." };
      }
    } catch {
      return { error: "Enter a valid song link (YouTube, Spotify, etc.)." };
    }
  }

  return { title, artist, genre, link, notes, email };
}

export async function createSongRequest(
  input: SongRequestInput,
): Promise<SongRequest> {
  if (!isMongoConfigured()) {
    throw new Error("Song requests are unavailable right now. Try again later.");
  }

  const normalized = normalizeSongRequestInput(input);
  if ("error" in normalized) {
    throw new Error(normalized.error);
  }

  await connectMongo();
  const now = new Date().toISOString();
  const doc = await SongRequestModel.create({
    id: crypto.randomUUID(),
    title: normalized.title,
    artist: normalized.artist,
    genre: normalized.genre || "",
    link: normalized.link || "",
    notes: normalized.notes || "",
    email: normalized.email || "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return toRequest(doc);
}

export async function listSongRequests(
  limit = 100,
): Promise<SongRequest[]> {
  if (!isMongoConfigured()) return [];

  await connectMongo();
  const docs = await SongRequestModel.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 200))
    .lean();

  return docs.map((doc) => toRequest(doc as Parameters<typeof toRequest>[0]));
}

export async function updateSongRequestStatus(
  id: string,
  status: SongRequestStatus,
): Promise<SongRequest | null> {
  if (!SONG_REQUEST_STATUSES.includes(status)) {
    throw new Error("Invalid status.");
  }
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  await connectMongo();
  const doc = await SongRequestModel.findOneAndUpdate(
    { id },
    { $set: { status, updatedAt: new Date().toISOString() } },
    { new: true },
  ).lean();

  return doc ? toRequest(doc as Parameters<typeof toRequest>[0]) : null;
}

export async function deleteSongRequest(id: string): Promise<boolean> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  await connectMongo();
  const result = await SongRequestModel.deleteOne({ id });
  return result.deletedCount > 0;
}
