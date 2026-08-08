import { NextResponse } from "next/server";
import {
  getHistoryIds,
  historyCookieOptions,
  historyCookieValue,
  pushHistoryId,
} from "@/lib/history";
import { getTrackById } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const ids = await getHistoryIds();
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

    const ids = pushHistoryId(await getHistoryIds(), trackId);
    const res = NextResponse.json({ ok: true, ids });
    const opts = historyCookieOptions(historyCookieValue(ids));
    res.cookies.set(opts.name, opts.value, opts);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, ids: [] as string[] });
  const opts = historyCookieOptions(historyCookieValue([]));
  res.cookies.set(opts.name, opts.value, opts);
  return res;
}
