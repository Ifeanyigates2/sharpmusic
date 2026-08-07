import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { updateArtistSocials } from "@/lib/news-store";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const nameKey = String(body.nameKey || "").trim();
    if (!nameKey) {
      return NextResponse.json({ error: "nameKey required" }, { status: 400 });
    }

    const artist = await updateArtistSocials(nameKey, {
      instagram: body.instagram,
      facebook: body.facebook,
      threads: body.threads,
      twitter: body.twitter,
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json({ artist });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
