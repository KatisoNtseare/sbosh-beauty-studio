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
  const [encodedEmail, signature] = value.split(".");
  if (!encodedEmail || !signature) return false;
  const email = Buffer.from(encodedEmail, "base64url").toString();
  if (email !== process.env.ADMIN_EMAIL) return false;
  const expected = sign(encodedEmail);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function adminCookieValue() {
  const encodedEmail = Buffer.from(process.env.ADMIN_EMAIL!).toString("base64url");
  return `${encodedEmail}.${sign(encodedEmail)}`;
}

export const adminCookieName = COOKIE;
