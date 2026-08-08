import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  createSongRequest,
  listSongRequests,
  normalizeSongRequestInput,
} from "@/lib/requests-store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await listSongRequests();
    return NextResponse.json({ requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const normalized = normalizeSongRequestInput({
      title: String(body.title ?? ""),
      artist: String(body.artist ?? ""),
      genre: String(body.genre ?? ""),
      link: String(body.link ?? ""),
      notes: String(body.notes ?? ""),
      email: String(body.email ?? ""),
    });

    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const songRequest = await createSongRequest(normalized);
    return NextResponse.json({ request: songRequest }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message.includes("unavailable") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
