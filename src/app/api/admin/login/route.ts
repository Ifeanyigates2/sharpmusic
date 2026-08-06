import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  authenticateAdmin,
  createAdminSessionToken,
  ensureSeedAdmin,
  isAdminConfigured,
} from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin login is not configured. Set MONGODB_URI and SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  try {
    await ensureSeedAdmin();

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    const user = await authenticateAdmin(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = createAdminSessionToken(user._id.toString());
    const res = NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name },
    });
    const opts = adminCookieOptions(token);
    res.cookies.set(opts.name, opts.value, opts);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not reach MongoDB. Check MONGODB_URI." },
      { status: 500 },
    );
  }
}
