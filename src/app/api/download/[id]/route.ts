import { NextResponse } from "next/server";
import { getTrackById } from "@/lib/store";
import { hasPurchased } from "@/lib/purchases";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const track = await getTrackById(id);
  if (!track) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  if (track.pricing === "paid" && !(await hasPurchased(track.id))) {
    return NextResponse.json(
      { error: "Purchase required before download." },
      { status: 402 },
    );
  }

  const upstream = await fetch(track.audioUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Could not fetch audio file." },
      { status: 502 },
    );
  }

  const filename = `${track.artist} - ${track.title}.mp3`.replace(
    /[^\w\s.-]/g,
    "",
  );

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
