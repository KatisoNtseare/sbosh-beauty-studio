import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "sbosh_admin";
const secret = () => process.env.AUTH_SECRET;
const sign = (value: string) => createHmac("sha256", secret() ?? "").update(value).digest("hex");

export function credentialsConfigured() {
  return Boolean(secret() && secret()!.length >= 32 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export async function validAdminSession() {
  if (!credentialsConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return false;
  const expected = sign(encodedPayload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as { email?: string; expiresAt?: number };
    return payload.email === process.env.ADMIN_EMAIL && Number(payload.expiresAt) > Date.now();
  } catch { return false; }
}

export function adminCookieValue() {
  const payload = Buffer.from(JSON.stringify({ email: process.env.ADMIN_EMAIL, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function adminIdentity() {
  return { id: process.env.ADMIN_EMAIL!, name: process.env.ADMIN_NAME || process.env.ADMIN_EMAIL! };
}

export const adminCookieName = COOKIE;
