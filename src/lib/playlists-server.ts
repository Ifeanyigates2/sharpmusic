import { cookies } from "next/headers";
import {
  normalizePlaylists,
  PLAYLISTS_COOKIE,
  type Playlist,
} from "@/lib/playlists";

export async function getPlaylists(): Promise<Playlist[]> {
  const jar = await cookies();
  const raw = jar.get(PLAYLISTS_COOKIE)?.value;
  if (!raw) return [];
  try {
    return normalizePlaylists(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return [];
  }
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
  const list = await getPlaylists();
  return list.find((p) => p.id === id) || null;
}
