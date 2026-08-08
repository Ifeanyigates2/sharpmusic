import type { Metadata } from "next";
import { PlaylistsClient } from "@/components/PlaylistsClient";
import { getFavoriteIds } from "@/lib/favorites";
import { getPlaylists } from "@/lib/playlists-server";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Liked tracks and custom playlists on this device.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const [playlists, liked] = await Promise.all([
    getPlaylists(),
    getFavoriteIds(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Playlists
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Liked songs and custom lists saved on this device.
        </p>
      </div>
      <PlaylistsClient
        initialPlaylists={playlists}
        likedCount={liked.length}
      />
    </div>
  );
}
