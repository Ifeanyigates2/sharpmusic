import { NextResponse } from "next/server";
import { getTrackById } from "@/lib/store";
import {
  PURCHASES_COOKIE,
  getPurchasedIds,
  purchasesCookieValue,
} from "@/lib/purchases";

export async function POST(request: Request) {
  const body = (await request.json()) as { trackId?: string };
  const trackId = body.trackId?.trim();
  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  const track = await getTrackById(trackId);
  if (!track) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }
  if (track.pricing === "free") {
    return NextResponse.json({ ok: true, alreadyFree: true });
  }

  const owned = await getPurchasedIds();
  owned.add(track.id);
  const value = purchasesCookieValue([...owned]);

  const res = NextResponse.json({
    ok: true,
    trackId: track.id,
    amountCents: track.priceCents,
    demo: true,
    message:
      "Demo checkout complete. Connect Stripe for real payments on Vercel.",
  });

  res.cookies.set(PURCHASES_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
