import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
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
    const signature = createUploadSignature();
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not create Cloudinary upload signature." },
      { status: 500 },
    );
  }
}
