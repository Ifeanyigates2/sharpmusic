import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { User, type UserDocument } from "@/models/User";

export const ADMIN_COOKIE = "sharpmusic_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function sessionSecret(): string | undefined {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    undefined
  );
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isAdminConfigured(): boolean {
  return isMongoConfigured() && Boolean(sessionSecret());
}

export async function findAdminByEmail(
  email: string,
): Promise<UserDocument | null> {
  await connectMongo();
  return User.findOne({
    email: email.trim().toLowerCase(),
    role: "admin",
  });
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<UserDocument | null> {
  if (!email || !password) return null;
  const user = await findAdminByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function createAdminSessionToken(userId: string): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
): { userId: string } | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload, secret);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const [userId, expRaw] = payload.split(".");
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;
  return { userId };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const session = verifyAdminSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!session) return false;

  try {
    await connectMongo();
    const user = await User.findById(session.userId).select("_id role");
    return Boolean(user && user.role === "admin");
  } catch {
    return false;
  }
}

export function adminCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function ensureSeedAdmin(): Promise<boolean> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password || !isMongoConfigured()) return false;

  await connectMongo();
  const existing = await User.findOne({ email });
  if (existing) return false;

  await User.create({
    email,
    name: "Admin",
    passwordHash: await hashPassword(password),
    role: "admin",
  });
  return true;
}
