import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { DownloadButton } from "@/components/DownloadButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PlayButton } from "@/components/PlayButton";
import { ShareButton } from "@/components/ShareButton";
import { TrackCard } from "@/components/TrackCard";
import { getRelatedTracks } from "@/lib/charts";
import {
  artistPath,
  formatDownloads,
  formatDuration,
  formatPrice,
} from "@/lib/format";
import { getFavoriteIds, hasFavorite } from "@/lib/favorites";
import { hasPurchased } from "@/lib/purchases";
import { trackShareMetadata } from "@/lib/share-metadata";
import { getAllTracks, getTrackById } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) return { title: "Track" };
  return trackShareMetadata(track);
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) notFound();

  const catalog = await getAllTracks();
  const related = getRelatedTracks(track, catalog, 6);
  const [owned, favorited, favoriteIds] = await Promise.all([
    track.pricing === "free"
      ? Promise.resolve(true)
      : hasPurchased(track.id),
    hasFavorite(track.id),
    getFavoriteIds(),
  ]);
  const favoriteSet = new Set(favoriteIds);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
          <CoverArt
            track={track}
            sizes="(max-width:1024px) 100vw, 420px"
            priority
          />
          {!track.coverImageUrl && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--signal)]">
            {track.genre} · {track.country}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)] sm:text-5xl">
            {track.title}
          </h1>
          <p className="mt-2 text-xl text-[color:var(--mist)]">
            <Link
              href={artistPath(track.artist)}
              className="hover:text-[color:var(--signal)]"
            >
              {track.artist}
            </Link>
          </p>
          <p className="mt-6 max-w-xl text-[color:var(--mist)] leading-relaxed">
            {track.description}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[color:var(--mist)]">Length</dt>
              <dd className="mt-1 text-[color:var(--foam)]">
                {formatDuration(track.durationSec)}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--mist)]">Price</dt>
              <dd className="mt-1 text-[color:var(--foam)]">
                {formatPrice(track.priceCents, track.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--mist)]">Downloads</dt>
              <dd className="mt-1 text-[color:var(--foam)]">
                {formatDownloads(track.downloads)}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--mist)]">License</dt>
              <dd className="mt-1 text-[color:var(--foam)]">{track.license}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <PlayButton track={track} queue={catalog} />
            <DownloadButton track={track} initiallyOwned={owned} />
            <FavoriteButton
              trackId={track.id}
              initiallyFavorited={favorited}
            />
            <ShareButton
              title={`${track.title} — ${track.artist}`}
              text={track.description}
              urlPath={`/track/${track.id}`}
            />
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-white/10 pt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[color:var(--foam)]">
                More like this
              </h2>
              <p className="mt-1 text-sm text-[color:var(--mist)]">
                Similar artists, genres, and regions from the catalog.
              </p>
            </div>
            <Link
              href="/charts"
              className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
            >
              View charts →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {related.map((item) => (
              <TrackCard
                key={item.id}
                track={item}
                queue={related}
                favorited={favoriteSet.has(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
