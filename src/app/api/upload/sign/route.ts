import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  createUploadSignature,
  isCloudinaryConfigured,
  type CloudinaryResourceType,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

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

  try {
    const body = (await request.json().catch(() => ({}))) as {
      kind?: string;
    };
    const kind = body.kind === "image" ? "image" : "audio";
    const folder =
      kind === "image" ? "sharpmusic/covers" : "sharpmusic/audio";
    const resourceType: CloudinaryResourceType =
      kind === "image" ? "image" : "video";

    const signature = createUploadSignature(folder, resourceType);
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not create Cloudinary upload signature." },
      { status: 500 },
    );
  }
}
