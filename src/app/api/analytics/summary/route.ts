import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { getAnalyticsSummary } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Admin sign-in required." },
      { status: 401 },
    );
  }

  try {
    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not load analytics." },
      { status: 500 },
    );
  }
}
