import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import { cloudinaryConfigured, cloudinaryPublicId, cloudinarySignature, destroyCloudinaryImage } from "@/lib/cloudinary";
import Service from "@/models/Service";

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!cloudinaryConfigured()) return Response.json({ error: "Image uploads are not configured. Add the Cloudinary server credentials." }, { status: 503 });
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !IMAGE_TYPES.has(file.type)) return Response.json({ error: "Choose a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
    await connectDb();
    const service = await Service.findById(id);
    if (!service) return Response.json({ error: "Service not found." }, { status: 404 });
    const cloud = process.env.CLOUDINARY_CLOUD_NAME!; const key = process.env.CLOUDINARY_API_KEY!; const secret = process.env.CLOUDINARY_API_SECRET!;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidSignature(bytes, file.type)) return Response.json({ error: "This file is not a valid JPG, PNG, or WebP image." }, { status: 400 });
    const publicId = `sbosh-services/${randomUUID()}`; const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = cloudinarySignature({ public_id: publicId, timestamp });
    const body = new FormData();
    body.set("file", new Blob([bytes], { type: file.type }), file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100));
    body.set("public_id", publicId); body.set("timestamp", timestamp); body.set("api_key", key); body.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` }, body });
    if (!response.ok) return Response.json({ error: "Cloudinary could not accept this image." }, { status: 502 });
    const uploaded = await response.json() as { secure_url?: string; public_id?: string; bytes?: number; format?: string };
    if (!uploaded.secure_url?.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`) || uploaded.public_id !== publicId) return Response.json({ error: "The uploaded image could not be verified." }, { status: 502 });
    const oldPublicId = service.imagePublicId;
    service.image = uploaded.secure_url; service.imagePublicId = publicId; await service.save();
    if (oldPublicId && cloudinaryPublicId(oldPublicId)) await destroyCloudinaryImage(oldPublicId).catch(() => false);
    return Response.json({ image: service.image });
  } catch { return Response.json({ error: "Image could not be uploaded." }, { status: 503 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    if (!cloudinaryConfigured()) return Response.json({ error: "Image storage is not configured." }, { status: 503 });
    await connectDb(); const service = await Service.findById(id);
    if (!service) return Response.json({ error: "Service not found." }, { status: 404 });
    const oldPublicId = service.imagePublicId; service.image = "/images/hero.jpg"; service.imagePublicId = ""; await service.save();
    if (oldPublicId && cloudinaryPublicId(oldPublicId)) await destroyCloudinaryImage(oldPublicId).catch(() => false);
    return Response.json({ service });
  } catch { return Response.json({ error: "Service image could not be removed." }, { status: 503 }); }
}
