import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MusicVideoPlayer } from "@/components/MusicVideoPlayer";
import {
  getLifestyleVideoById,
  listLifestyleVideos,
} from "@/lib/lifestyle-store";
import { LifestyleVideoCard } from "@/components/LifestyleVideoCard";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getLifestyleVideoById(id);
  if (!video) return { title: "Lifestyle video" };
  return {
    title: video.title,
    description: video.description || `${video.title} — Sharp Music lifestyle`,
    openGraph: {
      title: video.title,
      description: video.description || undefined,
      images: video.coverImageUrl ? [{ url: video.coverImageUrl }] : undefined,
    },
  };
}

export default async function LifestyleDetailPage({ params }: Props) {
  const { id } = await params;
  const video = await getLifestyleVideoById(id);
  if (!video) notFound();

  const others = (await listLifestyleVideos())
    .filter((v) => v.id !== video.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 md:px-6">
      <p className="text-sm text-[color:var(--mist)]">
        <Link href="/lifestyle" className="hover:text-[color:var(--signal)]">
          ← Lifestyle
        </Link>
      </p>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)] sm:text-4xl">
        {video.title}
      </h1>
      {video.description ? (
        <p className="mt-3 max-w-2xl text-[color:var(--mist)] leading-relaxed">
          {video.description}
        </p>
      ) : null}

      <div className="mt-8">
        <MusicVideoPlayer
          src={video.videoUrl}
          title={video.title}
          poster={video.coverImageUrl || undefined}
          label="Lifestyle video"
        />
      </div>

      {others.length > 0 ? (
        <section className="mt-16 border-t border-white/10 pt-12">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--foam)]">
            More lifestyle
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <LifestyleVideoCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
