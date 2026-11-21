import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminCookieName, adminCookieValue, credentialsConfigured } from "@/lib/admin-auth";
import { connectDb } from "@/lib/mongodb";
import { requestIp, withinRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!credentialsConfigured()) return Response.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const email = String(body.email ?? ""); const password = String(body.password ?? "");
  try {
    await connectDb();
    if (!(await withinRateLimit("admin-login", requestIp(request), 5, 60_000))) return Response.json({ error: "Too many sign-in attempts. Try again in a minute." }, { status: 429 });
  } catch { return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 }); }
  const expectedEmail = process.env.ADMIN_EMAIL!; const expectedPassword = process.env.ADMIN_PASSWORD!;
  const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, adminCookieValue(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
