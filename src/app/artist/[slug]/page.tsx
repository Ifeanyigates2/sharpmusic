import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayAllButton } from "@/components/PlayAllButton";
import { ShareButton } from "@/components/ShareButton";
import { TrackCard } from "@/components/TrackCard";
import { getArtistBySlug } from "@/lib/artists";
import { getFavoriteIds } from "@/lib/favorites";
import { profileHasSocials } from "@/lib/news-store";
import type { SocialPlatform } from "@/lib/news-types";
import { artistShareMetadata } from "@/lib/share-metadata";
import { socialProfileUrl } from "@/lib/social-sync";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "Artist" };
  const genres = [...new Set(artist.tracks.map((t) => t.genre))];
  const cover = artist.tracks.find((t) => t.coverImageUrl)?.coverImageUrl;
  return artistShareMetadata({
    name: artist.name,
    slug: artist.slug,
    trackCount: artist.tracks.length,
    coverImageUrl: cover,
    genres,
  });
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const socials =
    artist.profile && profileHasSocials(artist.profile)
      ? (
          [
            ["instagram", artist.profile.instagram],
            ["facebook", artist.profile.facebook],
            ["threads", artist.profile.threads],
            ["twitter", artist.profile.twitter],
          ] as const
        ).filter(([, handle]) => handle)
      : [];

  const regions = [...new Set(artist.tracks.map((t) => t.region))];
  const genres = [...new Set(artist.tracks.map((t) => t.genre))];
  const favoriteIds = await getFavoriteIds();
  const favoriteSet = new Set(favoriteIds);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--signal)]">
          Artist
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)] sm:text-5xl">
          {artist.name}
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          {artist.tracks.length} track
          {artist.tracks.length === 1 ? "" : "s"}
          {genres.length ? ` · ${genres.slice(0, 3).join(", ")}` : ""}
          {regions.length ? ` · ${regions.slice(0, 2).join(", ")}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {artist.tracks.length > 0 ? (
            <PlayAllButton tracks={artist.tracks} />
          ) : null}
          {socials.map(([platform, handle]) => (
            <a
              key={platform}
              href={socialProfileUrl(platform as SocialPlatform, handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[color:var(--signal)] hover:underline"
            >
              {platform === "twitter" ? "X" : platform} →
            </a>
          ))}
          <ShareButton
            title={`${artist.name} · Sharp Music`}
            text={`Listen to ${artist.name} on Sharp Music`}
            urlPath={`/artist/${artist.slug}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {artist.tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={artist.tracks}
            favorited={favoriteSet.has(track.id)}
          />
        ))}
      </div>

      <p className="mt-10 text-sm text-[color:var(--mist)]">
        Looking for something else?{" "}
        <Link
          href="/browse"
          className="font-semibold text-[color:var(--signal)] hover:underline"
        >
          Browse the catalog
        </Link>
        .
      </p>
    </div>
  );
}
