import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminTrackEditor } from "@/components/AdminTrackEditor";
import { isAdminAuthenticated } from "@/lib/admin";
import { getTrackById } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrackById(id);
  return {
    title: track ? `Edit ${track.title}` : "Edit track",
    robots: { index: false, follow: false },
  };
}

export default async function AdminEditTrackPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) {
    const { id } = await params;
    redirect(`/admin?next=/admin/tracks/${id}`);
  }

  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="edit" />
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Edit track
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Mix and enhance the audio, then update details or artwork.
        </p>
      </div>
      <AdminTrackEditor track={track} />
    </div>
  );
}
