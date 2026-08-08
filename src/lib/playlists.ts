export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  updatedAt: string;
};

export const PLAYLISTS_COOKIE = "sharpmusic_playlists";
export const MAX_PLAYLISTS = 12;
export const MAX_PLAYLIST_TRACKS = 80;
export const MAX_PLAYLIST_NAME = 40;

export function normalizePlaylists(raw: unknown): Playlist[] {
  if (!Array.isArray(raw)) return [];
  const out: Playlist[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id || "").trim();
    const name = String(row.name || "").trim().slice(0, MAX_PLAYLIST_NAME);
    const trackIds = Array.isArray(row.trackIds)
      ? [...new Set(row.trackIds.map(String).filter(Boolean))].slice(
          0,
          MAX_PLAYLIST_TRACKS,
        )
      : [];
    const updatedAt = String(row.updatedAt || new Date().toISOString());
    if (!id || !name) continue;
    out.push({ id, name, trackIds, updatedAt });
    if (out.length >= MAX_PLAYLISTS) break;
  }
  return out;
}

export function playlistsCookieValue(playlists: Playlist[]): string {
  return encodeURIComponent(
    JSON.stringify(normalizePlaylists(playlists).slice(0, MAX_PLAYLISTS)),
  );
}

export function playlistsCookieOptions(value: string) {
  return {
    name: PLAYLISTS_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
