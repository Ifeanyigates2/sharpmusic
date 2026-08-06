import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  addUploadedTrack,
  addUploadedTrackFromCloudinary,
} from "@/lib/store";
import type { Pricing } from "@/lib/types";
import { DEFAULT_PRICE_CENTS, GENRES, REGIONS } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB (Cloudinary-friendly; direct client upload)

function parseInput(source: FormData | Record<string, unknown>) {
  const get = (key: string) => {
    if (source instanceof FormData) return String(source.get(key) ?? "");
    return String(source[key] ?? "");
  };

  return {
    title: get("title").trim(),
    artist: get("artist").trim(),
    genre: get("genre"),
    region: get("region"),
    country: get("country").trim(),
    pricing: (get("pricing") || "free") as Pricing,
    priceCents: Number(get("priceCents") || DEFAULT_PRICE_CENTS),
    description: get("description"),
    license: get("license"),
  };
}

function validateInput(input: ReturnType<typeof parseInput>) {
  if (!input.title || !input.artist) {
    return "Title and artist are required.";
  }
  if (!GENRES.includes(input.genre as (typeof GENRES)[number])) {
    return "Invalid genre.";
  }
  if (!REGIONS.includes(input.region as (typeof REGIONS)[number])) {
    return "Invalid region.";
  }
  return null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Admin sign-in required." },
      { status: 401 },
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured." },
      { status: 503 },
    );
  }

  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "MongoDB is not configured." },
      { status: 503 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      const input = parseInput(body);
      const invalid = validateInput(input);
      if (invalid) {
        return NextResponse.json({ error: invalid }, { status: 400 });
      }

      const audioUrl = String(body.audioUrl ?? "").trim();
      if (!audioUrl) {
        return NextResponse.json(
          { error: "Cloudinary audioUrl is required." },
          { status: 400 },
        );
      }

      const track = await addUploadedTrackFromCloudinary(
        {
          ...input,
          pricing: input.pricing === "paid" ? "paid" : "free",
          priceCents: Number.isFinite(input.priceCents)
            ? input.priceCents
            : DEFAULT_PRICE_CENTS,
        },
        {
          url: audioUrl,
          durationSec: Number(body.durationSec) || 180,
          publicId: String(body.publicId ?? ""),
          coverImageUrl: String(body.coverImageUrl ?? "").trim(),
          coverPublicId: String(body.coverPublicId ?? "").trim(),
        },
      );

      return NextResponse.json({ track }, { status: 201 });
    }

    const form = await request.formData();
    const file = form.get("audio");
    const input = parseInput(form);
    const invalid = validateInput(input);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 100MB." },
        { status: 400 },
      );
    }

    const track = await addUploadedTrack(
      {
        ...input,
        pricing: input.pricing === "paid" ? "paid" : "free",
        priceCents: Number.isFinite(input.priceCents)
          ? input.priceCents
          : DEFAULT_PRICE_CENTS,
      },
      file,
    );

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed. Check Cloudinary and MongoDB settings.",
      },
      { status: 500 },
    );
  }
}
