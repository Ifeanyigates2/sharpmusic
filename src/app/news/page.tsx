import type { Metadata } from "next";
import Link from "next/link";
import { NewsPostCard } from "@/components/NewsPostCard";
import {
  ensureArtistProfiles,
  getNewsPosts,
  profileHasSocials,
} from "@/lib/news-store";
import { socialProfileUrl } from "@/lib/social-sync";
import type { SocialPlatform } from "@/lib/news-types";

export const metadata: Metadata = {
  title: "Music News",
  description:
    "Latest posts from artists on Sharp Music — Instagram, Facebook, Threads, and X.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const [posts, artists] = await Promise.all([
    getNewsPosts(80),
    ensureArtistProfiles(),
  ]);
  const linked = artists.filter(profileHasSocials);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Music News
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Latest posts from musicians with songs on Sharp Music — pulled from
          Instagram, Facebook, Threads, and X.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="mx-auto max-w-2xl space-y-8">
          {posts.map((post) => (
            <NewsPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : linked.length > 0 ? (
        <div className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
              Follow artists on the platform
            </h2>
            <ul className="space-y-4">
              {linked.map((artist) => {
                const platforms = (
                  [
                    ["instagram", artist.instagram],
                    ["facebook", artist.facebook],
                    ["threads", artist.threads],
                    ["twitter", artist.twitter],
                  ] as const
                ).filter(([, h]) => h);

                return (
                  <li key={artist.nameKey} className="border-t border-white/10 pt-4">
                    <p className="font-semibold text-[color:var(--foam)]">
                      {artist.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {platforms.map(([platform, handle]) => (
                        <a
                          key={platform}
                          href={socialProfileUrl(
                            platform as SocialPlatform,
                            handle,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[color:var(--signal)] hover:underline"
                        >
                          {platform === "twitter" ? "X" : platform} →
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            href="/browse"
            className="inline-block text-sm font-semibold text-[color:var(--signal)] hover:underline"
          >
            Browse the catalog →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
