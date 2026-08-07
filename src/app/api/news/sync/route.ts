import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { syncAllArtistNews } from "@/lib/social-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

function cronAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization");
  const secrets = [
    process.env.NEWS_CRON_SECRET?.trim(),
    process.env.CRON_SECRET?.trim(),
  ].filter(Boolean) as string[];
  return secrets.some((secret) => header === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  const cron = cronAuthorized(request);
  if (!admin && !cron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllArtistNews();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Vercel Cron uses GET by default
  return POST(request);
}
