import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TrackCard } from "@/components/TrackCard";
import { coverGradient } from "@/lib/format";
import { getAllTracks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tracks = await getAllTracks();
  const featured = tracks.slice(0, 8);
  const spotlight = tracks[0];

  return (
    <>
      <section className="hero-shell">
        <div className="hero-visual" aria-hidden>
          {spotlight?.coverImageUrl ? (
            <Image
              src={spotlight.coverImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="hero-cover object-cover"
            />
          ) : spotlight ? (
            <div
              className="absolute inset-0 hero-cover"
              style={{ background: coverGradient(spotlight.coverHue) }}
            />
          ) : null}
          <div className="hero-veil" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-14 pt-28 md:px-6 md:pb-20 md:pt-32">
          <div className="max-w-2xl">
            <div className="rise flex items-center gap-4 sm:gap-5">
              <BrandLogo size="xl" href={null} priority />
              <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-none tracking-[0.04em] text-[color:var(--foam)] sm:text-6xl md:text-7xl">
                Sharp
                <br />
                Music
              </p>
            </div>

            <h1 className="rise rise-delay-1 mt-8 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-[color:var(--foam)] sm:text-3xl md:text-4xl">
              Music from everywhere, ready to download.
            </h1>

            <p className="rise rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-[color:var(--mist)] sm:text-lg">
              Stream the catalog, grab free tracks, or buy downloads with a
              commercial license.
            </p>

            <div className="rise rise-delay-3 mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/browse"
                className="rounded-sm bg-[color:var(--signal)] px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
              >
                Browse the catalog
              </Link>
              <a
                href="#fresh"
                className="text-sm font-semibold text-[color:var(--foam)] transition hover:text-[color:var(--signal)]"
              >
                Hear what's new
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="fresh"
        className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:px-6 md:py-20"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[color:var(--foam)] sm:text-3xl">
              Fresh from the catalog
            </h2>
            <p className="mt-2 text-sm text-[color:var(--mist)]">
              Newest uploads first — play instantly, download in one tap.
            </p>
          </div>
          <Link
            href="/browse"
            className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {featured.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--mist)]">
            No tracks yet. Check back soon.
          </p>
        )}
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="max-w-lg font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[color:var(--foam)] sm:text-3xl">
            Download without the noise.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[color:var(--mist)] sm:text-base">
            A curated library — free tracks, paid licenses, and admin-only
            uploads so the catalog stays sharp.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                title: "Free library",
                copy: "Curated free tracks you can download in one click.",
              },
              {
                title: "Paid licenses",
                copy: "Buy commercial downloads when a track is priced.",
              },
              {
                title: "Admin curated",
                copy: "Only admins upload — quality stays under control.",
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-white/10 pt-5">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--mist)]">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
