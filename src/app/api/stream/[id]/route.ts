import { NextResponse } from "next/server";
import { getTrackById } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Public streaming proxy with HTTP Range support so the player can
 * seek and buffer progressively without downloading the full file.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  const range = request.headers.get("range");
  const upstreamHeaders: HeadersInit = {};
  if (range) upstreamHeaders.Range = range;

  const upstream = await fetch(track.audioUrl, {
    headers: upstreamHeaders,
    // Prefer fresh CDN bytes for range seeks
    cache: "no-store",
  });

  if ((!upstream.ok && upstream.status !== 206) || !upstream.body) {
    return NextResponse.json(
      { error: "Could not fetch audio stream." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") || "audio/mpeg",
  );
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("Content-Range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
