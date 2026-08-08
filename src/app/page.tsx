import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CatalogScroller } from "@/components/CatalogScroller";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { LifestyleVideoCard } from "@/components/LifestyleVideoCard";
import { MusicVideoCard } from "@/components/MusicVideoCard";
import { PlayAllButton } from "@/components/PlayAllButton";
import { getFavoriteIds } from "@/lib/favorites";
import { listLifestyleVideos } from "@/lib/lifestyle-store";
import { getAllTracks, getTracksWithVideos } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tracks, favoriteIds, musicVideos, lifestyle] = await Promise.all([
    getAllTracks(),
    getFavoriteIds(),
    getTracksWithVideos(),
    listLifestyleVideos(),
  ]);
  const featured = tracks.slice(0, 16);
  const watchMusic = musicVideos.slice(0, 4);
  const watchLifestyle = lifestyle.slice(0, 3);
  const showWatch = watchMusic.length > 0 || watchLifestyle.length > 0;

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
            <div className="rise rise-delay-2 flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {featured.length > 0 ? (
                <PlayAllButton tracks={tracks} label="Play catalog" />
              ) : null}
              <Link
                href="/browse"
                className="rounded-sm border border-white/20 px-5 py-2.5 text-sm font-semibold text-[color:var(--foam)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)]"
              >
                Browse
              </Link>
            </div>
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
              href="/charts"
              className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
            >
              Charts →
            </Link>
          </div>

          <div className="mx-auto max-w-6xl">
            <CatalogScroller
              tracks={featured}
              queue={tracks}
              favoriteIds={favoriteIds}
            />
          </div>
        </div>
      </section>

      {showWatch ? (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[color:var(--foam)] sm:text-3xl">
                  Watch
                </h2>
                <p className="mt-2 text-sm text-[color:var(--mist)]">
                  Music videos and lifestyle clips from the catalog.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                <Link
                  href="/videos"
                  className="text-[color:var(--signal)] hover:underline"
                >
                  All music videos →
                </Link>
                <Link
                  href="/lifestyle"
                  className="text-[color:var(--signal)] hover:underline"
                >
                  Lifestyle →
                </Link>
              </div>
            </div>

            {watchMusic.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {watchMusic.map((track) => (
                  <MusicVideoCard
                    key={track.id}
                    track={track}
                    queue={musicVideos}
                  />
                ))}
              </div>
            ) : null}

            {watchLifestyle.length > 0 ? (
              <div
                className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                  watchMusic.length > 0 ? "mt-6" : ""
                }`}
              >
                {watchLifestyle.map((video) => (
                  <LifestyleVideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

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

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:flex-row md:items-end md:justify-between md:px-6 md:py-20">
          <div className="max-w-lg">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[color:var(--foam)] sm:text-3xl">
              Can&apos;t find a track?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--mist)] sm:text-base">
              Search the catalog, then recommend songs you want us to add.
            </p>
          </div>
          <Link
            href="/request"
            className="shrink-0 self-start rounded-sm bg-[color:var(--signal)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110 md:self-auto"
          >
            Find & request
          </Link>
        </div>
      </section>
    </>
  );
}
