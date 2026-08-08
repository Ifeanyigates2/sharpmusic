import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  createLifestyleVideo,
  listLifestyleVideos,
} from "@/lib/lifestyle-store";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const videos = await listLifestyleVideos();
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
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

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const videoUrl = String(body.videoUrl ?? "").trim();
    const videoPublicId = String(body.videoPublicId ?? "").trim();
    const coverImageUrl = String(body.coverImageUrl ?? "").trim();
    const coverPublicId = String(body.coverPublicId ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required." },
        { status: 400 },
      );
    }

    const video = await createLifestyleVideo(
      { title, description },
      { videoUrl, videoPublicId, coverImageUrl, coverPublicId },
    );
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create video.",
      },
      { status: 500 },
    );
  }
}
