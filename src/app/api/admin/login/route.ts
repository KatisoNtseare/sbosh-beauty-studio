import { NextResponse } from "next/server";
import { adminCookieName, adminCookieValue, credentialsConfigured } from "@/lib/admin-auth";
import { connectDb } from "@/lib/mongodb";
import { requestIp, withinRateLimit } from "@/lib/rate-limit";
import Admin from "@/models/Admin";
import { verifyAdminPassword } from "@/lib/admin-password";

export async function POST(request: Request) {
  if (!credentialsConfigured()) return Response.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || password.length > 256) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  try {
    await connectDb();
    if (!(await withinRateLimit("admin-login", requestIp(request), 5, 60_000))) return Response.json({ error: "Too many sign-in attempts. Try again in a minute." }, { status: 429 });
  } catch { return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 }); }
  const admin = await Admin.findOne({ email, active: true }).select("+passwordHash +passwordSalt");
  if (!admin || !verifyAdminPassword(password, admin.passwordSalt, admin.passwordHash)) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, adminCookieValue({ id: admin.id, email: admin.email, name: admin.name }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
