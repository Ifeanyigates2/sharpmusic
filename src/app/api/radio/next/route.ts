import { NextResponse } from "next/server";
import { pickNextTrackWithGemini } from "@/lib/gemini-radio";
import { getAllTracks, getTrackById } from "@/lib/store";

export const runtime = "nodejs";

const MAX_RECENT = 20;
const MAX_CANDIDATES = 80;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      currentId?: string;
      recentIds?: unknown;
      candidateIds?: unknown;
    };

    const currentId = String(body.currentId || "").trim();
    if (!currentId) {
      return NextResponse.json({ error: "currentId required" }, { status: 400 });
    }

    const current = await getTrackById(currentId);
    if (!current) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const recentIds = Array.isArray(body.recentIds)
      ? body.recentIds
          .map((id) => String(id || "").trim())
          .filter(Boolean)
          .slice(0, MAX_RECENT)
      : [];

    const recentSet = new Set([...recentIds, currentId]);
    const all = await getAllTracks();

    let pool = all.filter((t) => !recentSet.has(t.id));

    if (Array.isArray(body.candidateIds) && body.candidateIds.length > 0) {
      const wanted = new Set(
        body.candidateIds.map((id) => String(id || "").trim()).filter(Boolean),
      );
      pool = pool.filter((t) => wanted.has(t.id));
    }

    // If everything was recently played, allow the full catalog except current
    if (pool.length === 0) {
      pool = all.filter((t) => t.id !== currentId);
    }

    // Prefer a manageable candidate set for the model
    if (pool.length > MAX_CANDIDATES) {
      // Keep same-genre / same-region first, then fill
      const preferred = pool.filter(
        (t) => t.genre === current.genre || t.region === current.region,
      );
      const rest = pool.filter(
        (t) => t.genre !== current.genre && t.region !== current.region,
      );
      pool = [...preferred, ...rest].slice(0, MAX_CANDIDATES);
    }

    const pick = await pickNextTrackWithGemini({
      current,
      candidates: pool,
      recentIds,
    });

    if (!pick) {
      return NextResponse.json(
        { error: "No next track available" },
        { status: 404 },
      );
    }

    const track = all.find((t) => t.id === pick.trackId) || (await getTrackById(pick.trackId));
    if (!track) {
      return NextResponse.json(
        { error: "Picked track missing from catalog" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      track,
      reason: pick.reason,
      source: pick.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Next track failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
