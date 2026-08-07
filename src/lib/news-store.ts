import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { ArtistProfileModel } from "@/models/ArtistProfile";
import { NewsPostModel } from "@/models/NewsPost";
import { getAllTracks } from "@/lib/store";
import {
  artistNameKey,
  cleanHandle,
  type ArtistProfile,
  type NewsPost,
  type SocialHandles,
  type SocialPlatform,
} from "@/lib/news-types";

function toArtist(doc: {
  name: string;
  nameKey: string;
  instagram?: string | null;
  facebook?: string | null;
  threads?: string | null;
  twitter?: string | null;
  lastSyncedAt?: string | null;
  updatedAt: string;
}): ArtistProfile {
  return {
    name: doc.name,
    nameKey: doc.nameKey,
    instagram: doc.instagram || "",
    facebook: doc.facebook || "",
    threads: doc.threads || "",
    twitter: doc.twitter || "",
    lastSyncedAt: doc.lastSyncedAt || "",
    updatedAt: doc.updatedAt,
  };
}

function toPost(doc: {
  id: string;
  artistName: string;
  artistKey: string;
  platform: SocialPlatform;
  externalId: string;
  text?: string | null;
  mediaUrl?: string | null;
  permalink: string;
  authorHandle?: string | null;
  postedAt: string;
  fetchedAt: string;
}): NewsPost {
  return {
    id: doc.id,
    artistName: doc.artistName,
    artistKey: doc.artistKey,
    platform: doc.platform,
    externalId: doc.externalId,
    text: doc.text || "",
    mediaUrl: doc.mediaUrl || "",
    permalink: doc.permalink,
    authorHandle: doc.authorHandle || "",
    postedAt: doc.postedAt,
    fetchedAt: doc.fetchedAt,
  };
}

/** Ensure every catalog artist has a profile row. */
export async function ensureArtistProfiles(): Promise<ArtistProfile[]> {
  if (!isMongoConfigured()) return [];

  await connectMongo();
  const tracks = await getAllTracks();
  const names = [...new Set(tracks.map((t) => t.artist.trim()).filter(Boolean))];
  const now = new Date().toISOString();

  for (const name of names) {
    const nameKey = artistNameKey(name);
    await ArtistProfileModel.updateOne(
      { nameKey },
      {
        $setOnInsert: {
          name,
          nameKey,
          instagram: "",
          facebook: "",
          threads: "",
          twitter: "",
          lastSyncedAt: "",
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  const docs = await ArtistProfileModel.find({
    nameKey: { $in: names.map(artistNameKey) },
  })
    .sort({ name: 1 })
    .lean();

  return docs.map(toArtist);
}

export async function getArtistProfiles(): Promise<ArtistProfile[]> {
  return ensureArtistProfiles();
}

export async function updateArtistSocials(
  nameKey: string,
  handles: SocialHandles,
): Promise<ArtistProfile | null> {
  if (!isMongoConfigured()) return null;
  await connectMongo();

  const doc = await ArtistProfileModel.findOneAndUpdate(
    { nameKey },
    {
      $set: {
        ...(handles.instagram !== undefined
          ? { instagram: cleanHandle(handles.instagram) }
          : {}),
        ...(handles.facebook !== undefined
          ? { facebook: cleanHandle(handles.facebook) }
          : {}),
        ...(handles.threads !== undefined
          ? { threads: cleanHandle(handles.threads) }
          : {}),
        ...(handles.twitter !== undefined
          ? { twitter: cleanHandle(handles.twitter) }
          : {}),
        updatedAt: new Date().toISOString(),
      },
    },
    { new: true },
  ).lean();

  return doc ? toArtist(doc) : null;
}

export async function getNewsPosts(limit = 60): Promise<NewsPost[]> {
  if (!isMongoConfigured()) return [];
  await connectMongo();
  const docs = await NewsPostModel.find()
    .sort({ postedAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPost);
}

export async function upsertNewsPosts(
  posts: Omit<NewsPost, "id" | "fetchedAt">[],
): Promise<number> {
  if (!isMongoConfigured() || posts.length === 0) return 0;
  await connectMongo();
  const now = new Date().toISOString();
  let count = 0;

  for (const post of posts) {
    const id = `${post.platform}:${post.externalId}`;
    await NewsPostModel.updateOne(
      { platform: post.platform, externalId: post.externalId },
      {
        $set: {
          id,
          artistName: post.artistName,
          artistKey: post.artistKey,
          platform: post.platform,
          externalId: post.externalId,
          text: post.text,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          authorHandle: post.authorHandle,
          postedAt: post.postedAt,
          fetchedAt: now,
        },
      },
      { upsert: true },
    );
    count += 1;
  }

  return count;
}

export async function markArtistSynced(nameKey: string): Promise<void> {
  if (!isMongoConfigured()) return;
  await connectMongo();
  await ArtistProfileModel.updateOne(
    { nameKey },
    { $set: { lastSyncedAt: new Date().toISOString() } },
  );
}

export function profileHasSocials(artist: ArtistProfile): boolean {
  return Boolean(
    artist.instagram || artist.facebook || artist.threads || artist.twitter,
  );
}
