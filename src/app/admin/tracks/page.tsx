import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminTrackList } from "@/components/AdminTrackList";
import { isAdminAuthenticated } from "@/lib/admin";
import { getAdminTracks } from "@/lib/store";

export const metadata: Metadata = {
  title: "Manage tracks",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTracksPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/tracks");
  }

  const tracks = await getAdminTracks();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="tracks" />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
            Manage tracks
          </h1>
          <p className="mt-3 text-[color:var(--mist)]">
            Edit or delete any song in the catalog.
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-sm bg-[color:var(--signal)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
        >
          Upload new
        </Link>
      </div>
      <AdminTrackList tracks={tracks} />
    </div>
  );
}
