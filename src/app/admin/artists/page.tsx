import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminArtistSocialForm } from "@/components/AdminArtistSocialForm";
import { AdminNav } from "@/components/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin";
import { ensureArtistProfiles } from "@/lib/news-store";

export const metadata: Metadata = {
  title: "Artists & socials",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/artists");
  }

  const artists = await ensureArtistProfiles();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="artists" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Artists & socials
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--mist)]">
        Link Instagram, Facebook, Threads, and X handles for every musician who
        has tracks on the platform. Music News syncs their latest posts.
      </p>
      <div className="mt-8">
        <AdminArtistSocialForm artists={artists} />
      </div>
    </div>
  );
}
