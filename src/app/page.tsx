import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CatalogScroller } from "@/components/CatalogScroller";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { getAllTracks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tracks = await getAllTracks();
  const featured = tracks.slice(0, 16);
  const heroCovers = tracks
    .filter((t) => t.coverImageUrl)
    .slice(0, 12)
    .map(({ id, title, coverImageUrl, coverHue }) => ({
      id,
      title,
      coverImageUrl,
      coverHue,
    }));

  const covers =
    heroCovers.length > 0
      ? heroCovers
      : tracks.slice(0, 8).map(({ id, title, coverImageUrl, coverHue }) => ({
          id,
          title,
          coverImageUrl,
          coverHue,
        }));

  return (
    <>
      <section className="hero-shell">
        <div className="hero-visual" aria-hidden>
          <HeroBackdrop covers={covers} />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-5 md:px-6 md:pt-28 md:pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-xl">
              <div className="rise flex items-center gap-3 sm:gap-4">
                <BrandLogo size="lg" href={null} priority />
                <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-none tracking-[0.04em] text-[color:var(--foam)] sm:text-5xl">
                  Sharp Music
                </p>
              </div>
              <h1 className="rise rise-delay-1 mt-3 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug tracking-tight text-[color:var(--foam)] sm:text-2xl">
                Music from everywhere, ready to download.
              </h1>
            </div>
            <Link
              href="/browse"
              className="rise rise-delay-2 shrink-0 self-start rounded-sm bg-[color:var(--signal)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 sm:self-auto"
            >
              Browse the catalog
            </Link>
          </div>
        </div>

        <div id="fresh" className="relative pb-10 md:pb-12">
          <div className="mx-auto mb-4 flex max-w-6xl items-end justify-between gap-4 px-4 md:px-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[color:var(--foam)] sm:text-2xl">
                Fresh from the catalog
              </h2>
              <p className="mt-1 text-sm text-[color:var(--mist)]">
                Newest uploads — hover to pause.
              </p>
            </div>
            <Link
              href="/browse"
              className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mx-auto max-w-6xl">
            <CatalogScroller tracks={featured} queue={tracks} />
          </div>
        </div>
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
