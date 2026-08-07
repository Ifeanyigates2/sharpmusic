import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { getTrackById } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Admin sign-in required." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  const upstream = await fetch(track.audioUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Could not fetch audio file." },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "audio/mpeg",
      "Cache-Control": "private, max-age=60",
    },
  });
}
