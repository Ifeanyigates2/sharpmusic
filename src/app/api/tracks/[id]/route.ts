import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { isMongoConfigured } from "@/lib/mongodb";
import { deleteTrackById, updateTrackFromAdmin } from "@/lib/store";
import type { Pricing } from "@/lib/types";
import { DEFAULT_PRICE_CENTS, GENRES, REGIONS } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Admin sign-in required." },
      { status: 401 },
    );
  }
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503 },
    );
  }
  return null;
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const title = String(body.title ?? "").trim();
    const artist = String(body.artist ?? "").trim();
    const genre = String(body.genre ?? "");
    const region = String(body.region ?? "");
    const country = String(body.country ?? "").trim();
    const pricing =
      (String(body.pricing ?? "free") as Pricing) === "paid" ? "paid" : "free";
    const priceCents = Number(body.priceCents ?? DEFAULT_PRICE_CENTS);
    const description = String(body.description ?? "");
    const license = String(body.license ?? "");

    if (!title || !artist) {
      return NextResponse.json(
        { error: "Title and artist are required." },
        { status: 400 },
      );
    }
    if (!GENRES.includes(genre as (typeof GENRES)[number])) {
      return NextResponse.json({ error: "Invalid genre." }, { status: 400 });
    }
    if (!REGIONS.includes(region as (typeof REGIONS)[number])) {
      return NextResponse.json({ error: "Invalid region." }, { status: 400 });
    }

    const track = await updateTrackFromAdmin(
      id,
      {
        title,
        artist,
        genre,
        region,
        country,
        pricing,
        priceCents: Number.isFinite(priceCents) ? priceCents : DEFAULT_PRICE_CENTS,
        description,
        license,
      },
      {
        audioUrl: String(body.audioUrl ?? "").trim() || undefined,
        durationSec: Number(body.durationSec) || undefined,
        publicId: String(body.publicId ?? "").trim() || undefined,
        coverImageUrl: String(body.coverImageUrl ?? "").trim() || undefined,
        coverPublicId: String(body.coverPublicId ?? "").trim() || undefined,
      },
    );

    return NextResponse.json({ track });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteTrackById(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 400 },
    );
  }
}
