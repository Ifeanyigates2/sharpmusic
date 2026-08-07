export type SocialPlatform = "instagram" | "facebook" | "threads" | "twitter";

export interface ArtistProfile {
  name: string;
  nameKey: string;
  instagram: string;
  facebook: string;
  threads: string;
  twitter: string;
  lastSyncedAt: string;
  updatedAt: string;
}

export interface NewsPost {
  id: string;
  artistName: string;
  artistKey: string;
  platform: SocialPlatform;
  externalId: string;
  text: string;
  mediaUrl: string;
  permalink: string;
  authorHandle: string;
  postedAt: string;
  fetchedAt: string;
}

export interface SocialHandles {
  instagram?: string;
  facebook?: string;
  threads?: string;
  twitter?: string;
}

export function artistNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
    .replace(/^https?:\/\/(www\.)?threads\.net\/@?/i, "")
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\?.*$/, "")
    .trim();
}
