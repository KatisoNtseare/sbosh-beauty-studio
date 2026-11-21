import { createHash } from "node:crypto";

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export function cloudinaryPublicId(value: unknown) {
  return typeof value === "string" && /^sbosh-services\/[a-f0-9-]{36}$/.test(value);
}

export function cloudinarySignature(parameters: Record<string, string>) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) throw new Error("Cloudinary is not configured.");
  const serialized = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  return createHash("sha1").update(`${serialized}${secret}`).digest("hex");
}

export async function destroyCloudinaryImage(publicId: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret || !cloudinaryPublicId(publicId)) return false;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = cloudinarySignature({ invalidate: "true", public_id: publicId, timestamp });
  const form = new FormData(); form.set("public_id", publicId); form.set("timestamp", timestamp); form.set("invalidate", "true"); form.set("api_key", key); form.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/destroy`, { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` }, body: form });
  if (!response.ok) return false;
  const data = await response.json() as { result?: string };
  return data.result === "ok" || data.result === "not found";
}
