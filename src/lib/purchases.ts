import { cookies } from "next/headers";

const COOKIE = "sharpmusic_purchases";

export async function getPurchasedIds(): Promise<Set<string>> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export async function hasPurchased(trackId: string): Promise<boolean> {
  return (await getPurchasedIds()).has(trackId);
}

export function purchasesCookieValue(ids: string[]): string {
  return encodeURIComponent(JSON.stringify(ids));
}

export const PURCHASES_COOKIE = COOKIE;
