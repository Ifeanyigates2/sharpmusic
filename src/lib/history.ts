import { cookies } from "next/headers";

export const HISTORY_COOKIE = "sharpmusic_history";
export const MAX_HISTORY = 40;

export async function getHistoryIds(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(HISTORY_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(String).filter(Boolean))].slice(
      0,
      MAX_HISTORY,
    );
  } catch {
    return [];
  }
}

export function historyCookieValue(ids: string[]): string {
  return encodeURIComponent(
    JSON.stringify([...new Set(ids)].slice(0, MAX_HISTORY)),
  );
}

export function historyCookieOptions(value: string) {
  return {
    name: HISTORY_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export function pushHistoryId(ids: string[], trackId: string): string[] {
  return [trackId, ...ids.filter((id) => id !== trackId)].slice(0, MAX_HISTORY);
}
