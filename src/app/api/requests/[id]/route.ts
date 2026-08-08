import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { appBaseUrl, sendRequestAddedEmail } from "@/lib/email";
import {
  deleteSongRequest,
  getSongRequestById,
  updateSongRequestStatus,
} from "@/lib/requests-store";
import type { SongRequestStatus } from "@/lib/request-types";
import { SONG_REQUEST_STATUSES } from "@/lib/request-types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      trackId?: string;
    };
    const status = String(body.status ?? "") as SongRequestStatus;
    const trackId = String(body.trackId || "").trim();

    if (!SONG_REQUEST_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const before = await getSongRequestById(id);
    const updated = await updateSongRequestStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    let emailSent = false;
    if (
      status === "added" &&
      before?.status !== "added" &&
      updated.email
    ) {
      const trackUrl = trackId
        ? `${appBaseUrl().replace(/\/$/, "")}/track/${trackId}`
        : undefined;
      const result = await sendRequestAddedEmail({
        to: updated.email,
        title: updated.title,
        artist: updated.artist,
        trackUrl,
      });
      emailSent = Boolean(result.ok && !result.skipped);
    }

    return NextResponse.json({ request: updated, emailSent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ok = await deleteSongRequest(id);
    if (!ok) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
