import Link from "next/link";
import { TrackCard } from "@/components/TrackCard";
import { getAllTracks } from "@/lib/store";

export default async function HomePage() {
  const tracks = await getAllTracks();
  const featured = tracks.slice(0, 6);

  return (
    <>
      <section className="hero-shell">
        <div className="hero-visual" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <p className="rise font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[0.06em] text-[color:var(--foam)] sm:text-6xl md:text-7xl">
            sharpmusic
          </p>
          <h1 className="rise rise-delay-1 mt-6 max-w-2xl font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-[color:var(--foam)] sm:text-4xl">
            Music from everywhere, ready to download.
          </h1>
          <p className="rise rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-[color:var(--mist)] sm:text-lg">
            Free and paid tracks curated for the world. Stream, buy, and
            download — from Lagos to Tokyo and every city between.
          </p>
          <div className="rise rise-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="rounded-sm bg-[color:var(--signal)] px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
            >
              Browse catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
            Fresh from the catalog
          </h2>
          <p className="mt-3 text-[color:var(--mist)]">
            Free downloads and marketplace tracks from artists across seven
            regions.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/browse"
            className="text-sm font-semibold text-[color:var(--signal)] hover:underline"
          >
            View full catalog →
          </Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[color:var(--deep)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-3 md:px-6">
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
