import { NextResponse } from "next/server";
import {
  FAVORITES_COOKIE,
  favoritesCookieOptions,
  favoritesCookieValue,
  getFavoriteIds,
} from "@/lib/favorites";
import { getTrackById } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const ids = await getFavoriteIds();
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { trackId?: string };
    const trackId = String(body.trackId || "").trim();
    if (!trackId) {
      return NextResponse.json({ error: "trackId required" }, { status: 400 });
    }

    const track = await getTrackById(trackId);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const ids = await getFavoriteIds();
    if (!ids.includes(trackId)) ids.unshift(trackId);

    const res = NextResponse.json({ ok: true, ids, favorited: true });
    const opts = favoritesCookieOptions(favoritesCookieValue(ids));
    res.cookies.set(opts.name, opts.value, opts);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save favorite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { trackId?: string };
    const trackId = String(body.trackId || "").trim();
    if (!trackId) {
      return NextResponse.json({ error: "trackId required" }, { status: 400 });
    }

    const ids = (await getFavoriteIds()).filter((id) => id !== trackId);
    const res = NextResponse.json({ ok: true, ids, favorited: false });
    const opts = favoritesCookieOptions(favoritesCookieValue(ids));
    res.cookies.set(opts.name, opts.value, opts);
    // Keep cookie even if empty so clients can sync
    if (ids.length === 0) {
      res.cookies.set(FAVORITES_COOKIE, favoritesCookieValue([]), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not remove favorite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
