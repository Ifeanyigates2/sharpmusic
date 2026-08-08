import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { DownloadButton } from "@/components/DownloadButton";
import { PlayButton } from "@/components/PlayButton";
import {
  artistPath,
  formatDownloads,
  formatDuration,
  formatPrice,
} from "@/lib/format";
import { hasPurchased } from "@/lib/purchases";
import { getAllTracks, getTrackById } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) return { title: "Track" };
  return {
    title: `${track.title} — ${track.artist}`,
    description: track.description,
  };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) notFound();

  const catalog = await getAllTracks();
  const owned = track.pricing === "free" || (await hasPurchased(track.id));

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
          </div>
        </div>
      </div>
    </div>
  );
}
