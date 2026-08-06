import { NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

const COOKIE = "sharpmusic_vid";

function newVisitorId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
    };
    const path = String(body.path || "/").slice(0, 200);

    // Skip noisy admin/api beacons from counting as public traffic optionally
    // Still count them for total site use — filter only api routes
    if (path.startsWith("/api/")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const existing = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.split("=")[1];

    const visitorId = existing || newVisitorId();
    await recordPageView(visitorId, path);

    const res = NextResponse.json({ ok: true });
    if (!existing) {
      res.cookies.set(COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
