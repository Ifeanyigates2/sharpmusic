import { cookies } from "next/headers";

export const FAVORITES_COOKIE = "sharpmusic_favorites";
const MAX_FAVORITES = 200;

export async function getFavoriteIds(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(FAVORITES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(String).filter(Boolean))].slice(
      0,
      MAX_FAVORITES,
    );
  } catch {
    return [];
  }
}

export async function hasFavorite(trackId: string): Promise<boolean> {
  return (await getFavoriteIds()).includes(trackId);
}

export function favoritesCookieValue(ids: string[]): string {
  return encodeURIComponent(
    JSON.stringify([...new Set(ids)].slice(0, MAX_FAVORITES)),
  );
}

export function favoritesCookieOptions(value: string) {
  return {
    name: FAVORITES_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
