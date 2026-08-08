import type { Metadata } from "next";
import Link from "next/link";
import { LifestyleVideoCard } from "@/components/LifestyleVideoCard";
import { listLifestyleVideos } from "@/lib/lifestyle-store";

export const metadata: Metadata = {
  title: "Lifestyle",
  description: "Lifestyle and culture videos from Sharp Music.",
};

export const dynamic = "force-dynamic";

export default async function LifestylePage() {
  const videos = await listLifestyleVideos();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
            Lifestyle
          </h1>
          <p className="mt-3 text-[color:var(--mist)]">
            Culture, moments, and behind-the-scenes — not tied to a single track.
          </p>
        </div>
        <Link
          href="/videos"
          className="shrink-0 text-sm font-semibold text-[color:var(--signal)] hover:underline"
        >
          Music videos →
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10">
          <p className="text-[color:var(--mist)]">
            No lifestyle videos yet. Check back soon, or watch{" "}
            <Link
              href="/videos"
              className="font-semibold text-[color:var(--signal)] hover:underline"
            >
              music videos
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <LifestyleVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
