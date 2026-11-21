import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminCookieName, adminCookieValue, credentialsConfigured } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!credentialsConfigured()) return Response.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? ""); const password = String(body.password ?? "");
  const expectedEmail = process.env.ADMIN_EMAIL!; const expectedPassword = process.env.ADMIN_PASSWORD!;
  const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, adminCookieValue(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
