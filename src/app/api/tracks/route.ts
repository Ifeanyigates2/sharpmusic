import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tracks = await searchTracks({
    q: searchParams.get("q") ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    pricing: searchParams.get("pricing") ?? undefined,
  });
  return NextResponse.json({ tracks });
}
