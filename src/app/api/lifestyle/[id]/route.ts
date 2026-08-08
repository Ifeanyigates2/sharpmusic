import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  deleteLifestyleVideo,
  updateLifestyleVideo,
} from "@/lib/lifestyle-store";
import { isMongoConfigured } from "@/lib/mongodb";

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
    const description = String(body.description ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const video = await updateLifestyleVideo(
      id,
      { title, description },
      {
        videoUrl: String(body.videoUrl ?? "").trim() || undefined,
        videoPublicId: String(body.videoPublicId ?? "").trim() || undefined,
        coverImageUrl: String(body.coverImageUrl ?? "").trim() || undefined,
        coverPublicId: String(body.coverPublicId ?? "").trim() || undefined,
        clearCover: body.clearCover === true,
      },
    );
    return NextResponse.json({ video });
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
    await deleteLifestyleVideo(id);
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
