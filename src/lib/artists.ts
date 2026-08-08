import { artistSlug } from "@/lib/format";
import { ensureArtistProfiles } from "@/lib/news-store";
import { artistNameKey, type ArtistProfile } from "@/lib/news-types";
import { getAllTracks } from "@/lib/store";
import type { Track } from "@/lib/types";

export type ArtistCatalog = {
  name: string;
  slug: string;
  tracks: Track[];
  profile: ArtistProfile | null;
};

export async function getArtistBySlug(
  slug: string,
): Promise<ArtistCatalog | null> {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  if (!normalized) return null;

  const tracks = await getAllTracks();
  const matching = tracks.filter(
    (t) => artistSlug(t.artist) === normalized,
  );
  if (matching.length === 0) return null;

  // Prefer the most common display spelling in the catalog
  const counts = new Map<string, number>();
  for (const t of matching) {
    counts.set(t.artist, (counts.get(t.artist) || 0) + 1);
  }
  const name = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const key = artistNameKey(name);

  const profiles = await ensureArtistProfiles();
  const profile =
    profiles.find((p) => p.nameKey === key) ||
    profiles.find((p) => artistSlug(p.name) === normalized) ||
    null;

  return {
    name,
    slug: artistSlug(name),
    tracks: matching,
    profile,
  };
}
