import type { Metadata } from "next";
import type { Track } from "@/lib/types";

const SITE = "Sharp Music";
const FALLBACK_IMAGE = "/logo.png";

export function trackShareMetadata(track: Track): Metadata {
  const title = `${track.title} — ${track.artist}`;
  const description =
    track.description?.trim() ||
    `Listen to and download ${track.title} by ${track.artist} on Sharp Music.`;
  const url = `/track/${track.id}`;
  const image = track.coverImageUrl?.trim() || FALLBACK_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE,
      type: "music.song",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function artistShareMetadata(options: {
  name: string;
  slug: string;
  trackCount: number;
  coverImageUrl?: string;
  genres?: string[];
}): Metadata {
  const title = options.name;
  const genreBit = options.genres?.length
    ? ` · ${options.genres.slice(0, 3).join(", ")}`
    : "";
  const description = `Listen to ${options.trackCount} track${
    options.trackCount === 1 ? "" : "s"
  } by ${options.name} on Sharp Music${genreBit}.`;
  const url = `/artist/${options.slug}`;
  const image = options.coverImageUrl?.trim() || FALLBACK_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${SITE}`,
      description,
      url,
      siteName: SITE,
      type: "profile",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE}`,
      description,
      images: [image],
    },
  };
}
