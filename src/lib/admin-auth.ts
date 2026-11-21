import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "sbosh_admin";
const secret = () => process.env.AUTH_SECRET;
const sign = (value: string) => createHmac("sha256", secret() ?? "").update(value).digest("hex");

export function credentialsConfigured() {
  return Boolean(secret() && secret()!.length >= 32);
}

type AdminSession = { id: string; email: string; name: string; expiresAt: number };

async function readAdminSession(): Promise<AdminSession | null> {
  if (!credentialsConfigured()) return null;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = sign(encodedPayload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as Partial<AdminSession>;
    if (!payload.id || !payload.email || !payload.name || Number(payload.expiresAt) <= Date.now()) return null;
    return payload as AdminSession;
  } catch { return null; }
}

export async function validAdminSession() {
  return Boolean(await readAdminSession());
}

export function adminCookieValue(admin: Pick<AdminSession, "id" | "email" | "name">) {
  const payload = Buffer.from(JSON.stringify({ ...admin, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function adminIdentity() {
  const session = await readAdminSession();
  return session ? { id: session.id, name: session.name } : null;
}

export const adminCookieName = COOKIE;
