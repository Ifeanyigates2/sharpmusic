import Link from "next/link";
import { TrackCard } from "@/components/TrackCard";
import { getAllTracks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tracks = await getAllTracks();
  const featured = tracks.slice(0, 6);

  return (
    <>
      <section className="hero-shell">
        <div className="hero-visual" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-6 md:px-6 md:pt-28 md:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="rise font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[0.06em] text-[color:var(--foam)] sm:text-5xl">
                sharpmusic
              </p>
              <h1 className="rise rise-delay-1 mt-2 max-w-xl font-[family-name:var(--font-display)] text-lg font-semibold leading-snug tracking-tight text-[color:var(--foam)] sm:text-2xl">
                Music from everywhere, ready to download.
              </h1>
            </div>
            <Link
              href="/browse"
              className="rise rise-delay-2 shrink-0 self-start rounded-sm bg-[color:var(--signal)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 sm:self-auto"
            >
              Browse all
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-2 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[color:var(--foam)] sm:text-2xl">
            Fresh from the catalog
          </h2>
          <Link
            href="/browse"
            className="text-sm font-semibold text-[color:var(--signal)] hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {featured.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[color:var(--deep)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3 md:px-6">
          {[
            {
              title: "Free library",
              copy: "Download curated free tracks with one click.",
            },
            {
              title: "Marketplace",
              copy: "Buy paid downloads with a commercial license when a track is priced.",
            },
            {
              title: "Admin curated",
              copy: "Only admins can upload music — the catalog stays under your control.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--mist)]">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
