import {
  getArtistProfiles,
  markArtistSynced,
  profileHasSocials,
  upsertNewsPosts,
} from "@/lib/news-store";
import type { ArtistProfile, SocialPlatform } from "@/lib/news-types";

type FetchedPost = {
  artistName: string;
  artistKey: string;
  platform: SocialPlatform;
  externalId: string;
  text: string;
  mediaUrl: string;
  permalink: string;
  authorHandle: string;
  postedAt: string;
};

export type SyncResult = {
  artists: number;
  posts: number;
  errors: string[];
  platforms: {
    twitter: boolean;
    instagram: boolean;
    facebook: boolean;
    threads: boolean;
  };
};

function twitterConfigured() {
  return Boolean(process.env.TWITTER_BEARER_TOKEN?.trim());
}

function metaConfigured() {
  return Boolean(process.env.META_ACCESS_TOKEN?.trim());
}

async function fetchJson<T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(url, {
    headers,
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 180)}`);
  }
  return res.json() as Promise<T>;
}

async function syncTwitter(
  artist: ArtistProfile,
): Promise<FetchedPost[]> {
  const token = process.env.TWITTER_BEARER_TOKEN?.trim();
  const handle = artist.twitter;
  if (!token || !handle) return [];

  type UserRes = { data?: { id: string; username: string } };
  const user = await fetchJson<UserRes>(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
    { Authorization: `Bearer ${token}` },
  );
  if (!user.data?.id) return [];

  type TweetsRes = {
    data?: Array<{
      id: string;
      text: string;
      created_at?: string;
      attachments?: { media_keys?: string[] };
    }>;
    includes?: {
      media?: Array<{ media_key: string; url?: string; preview_image_url?: string }>;
    };
  };

  const tweets = await fetchJson<TweetsRes>(
    `https://api.twitter.com/2/users/${user.data.id}/tweets?max_results=10&tweet.fields=created_at,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
    { Authorization: `Bearer ${token}` },
  );

  const mediaMap = new Map(
    (tweets.includes?.media || []).map((m) => [
      m.media_key,
      m.url || m.preview_image_url || "",
    ]),
  );

  return (tweets.data || []).map((t) => {
    const key = t.attachments?.media_keys?.[0];
    return {
      artistName: artist.name,
      artistKey: artist.nameKey,
      platform: "twitter" as const,
      externalId: t.id,
      text: t.text || "",
      mediaUrl: key ? mediaMap.get(key) || "" : "",
      permalink: `https://x.com/${user.data!.username}/status/${t.id}`,
      authorHandle: user.data!.username,
      postedAt: t.created_at || new Date().toISOString(),
    };
  });
}

async function syncInstagram(
  artist: ArtistProfile,
): Promise<FetchedPost[]> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const igBusinessId = process.env.META_IG_BUSINESS_ID?.trim();
  const handle = artist.instagram;
  if (!token || !igBusinessId || !handle) return [];

  type IgRes = {
    business_discovery?: {
      username?: string;
      media?: {
        data?: Array<{
          id: string;
          caption?: string;
          media_url?: string;
          permalink?: string;
          timestamp?: string;
          media_type?: string;
          thumbnail_url?: string;
        }>;
      };
    };
  };

  const fields = `business_discovery.username(${handle}){username,media.limit(8){id,caption,media_url,permalink,timestamp,media_type,thumbnail_url}}`;
  const data = await fetchJson<IgRes>(
    `https://graph.facebook.com/v21.0/${igBusinessId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`,
  );

  const username = data.business_discovery?.username || handle;
  return (data.business_discovery?.media?.data || []).map((m) => ({
    artistName: artist.name,
    artistKey: artist.nameKey,
    platform: "instagram" as const,
    externalId: m.id,
    text: m.caption || "",
    mediaUrl: m.thumbnail_url || m.media_url || "",
    permalink: m.permalink || `https://www.instagram.com/${username}/`,
    authorHandle: username,
    postedAt: m.timestamp || new Date().toISOString(),
  }));
}

async function syncFacebook(
  artist: ArtistProfile,
): Promise<FetchedPost[]> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const page = artist.facebook;
  if (!token || !page) return [];

  type FbRes = {
    data?: Array<{
      id: string;
      message?: string;
      full_picture?: string;
      permalink_url?: string;
      created_time?: string;
    }>;
  };

  // page can be username or page id
  const data = await fetchJson<FbRes>(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(page)}/posts?fields=id,message,full_picture,permalink_url,created_time&limit=8&access_token=${encodeURIComponent(token)}`,
  );

  return (data.data || []).map((p) => ({
    artistName: artist.name,
    artistKey: artist.nameKey,
    platform: "facebook" as const,
    externalId: p.id,
    text: p.message || "",
    mediaUrl: p.full_picture || "",
    permalink: p.permalink_url || `https://www.facebook.com/${page}`,
    authorHandle: page,
    postedAt: p.created_time || new Date().toISOString(),
  }));
}

async function syncThreads(
  artist: ArtistProfile,
): Promise<FetchedPost[]> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const threadsUserId = process.env.META_THREADS_USER_ID?.trim();
  const handle = artist.threads;
  if (!token || !handle) return [];

  // Prefer looking up via Threads API user profile when we have a user id configured
  // for the app; otherwise try username path when Meta grants it.
  type ThRes = {
    data?: Array<{
      id: string;
      text?: string;
      timestamp?: string;
      permalink?: string;
      media_url?: string;
      media_type?: string;
    }>;
  };

  let url: string;
  if (threadsUserId) {
    // App-owned Threads user can only fetch own media with user token —
    // for other creators, business discovery isn't available the same way.
    // Fallback: attempt username media endpoint when handle matches linked account.
    url = `https://graph.threads.net/v1.0/${encodeURIComponent(threadsUserId)}/threads?fields=id,text,timestamp,permalink,media_type,media_url&limit=8&access_token=${encodeURIComponent(token)}`;
  } else {
    return [];
  }

  // Only ingest if this artist's threads handle matches the configured account
  // (Threads API is account-scoped for reading media).
  const configuredHandle = process.env.META_THREADS_USERNAME?.trim()?.toLowerCase();
  if (configuredHandle && configuredHandle !== handle.toLowerCase()) {
    return [];
  }

  const data = await fetchJson<ThRes>(url);

  return (data.data || []).map((t) => ({
    artistName: artist.name,
    artistKey: artist.nameKey,
    platform: "threads" as const,
    externalId: t.id,
    text: t.text || "",
    mediaUrl: t.media_url || "",
    permalink: t.permalink || `https://www.threads.net/@${handle}`,
    authorHandle: handle,
    postedAt: t.timestamp || new Date().toISOString(),
  }));
}

export async function syncArtistNews(
  artist: ArtistProfile,
  errors: string[],
): Promise<FetchedPost[]> {
  const posts: FetchedPost[] = [];

  const runners: Array<[SocialPlatform, () => Promise<FetchedPost[]>]> = [
    ["twitter", () => syncTwitter(artist)],
    ["instagram", () => syncInstagram(artist)],
    ["facebook", () => syncFacebook(artist)],
    ["threads", () => syncThreads(artist)],
  ];

  for (const [platform, run] of runners) {
    try {
      const batch = await run();
      posts.push(...batch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${artist.name} / ${platform}: ${msg}`);
    }
  }

  await markArtistSynced(artist.nameKey);
  return posts;
}

export async function syncAllArtistNews(): Promise<SyncResult> {
  const artists = (await getArtistProfiles()).filter(profileHasSocials);
  const errors: string[] = [];
  const all: FetchedPost[] = [];

  for (const artist of artists) {
    const posts = await syncArtistNews(artist, errors);
    all.push(...posts);
  }

  const saved = await upsertNewsPosts(all);

  return {
    artists: artists.length,
    posts: saved,
    errors,
    platforms: {
      twitter: twitterConfigured(),
      instagram: metaConfigured() && Boolean(process.env.META_IG_BUSINESS_ID?.trim()),
      facebook: metaConfigured(),
      threads:
        metaConfigured() && Boolean(process.env.META_THREADS_USER_ID?.trim()),
    },
  };
}

export function socialProfileUrl(
  platform: SocialPlatform,
  handle: string,
): string {
  const h = handle.replace(/^@/, "");
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${h}/`;
    case "facebook":
      return `https://www.facebook.com/${h}`;
    case "threads":
      return `https://www.threads.net/@${h}`;
    case "twitter":
      return `https://x.com/${h}`;
  }
}
