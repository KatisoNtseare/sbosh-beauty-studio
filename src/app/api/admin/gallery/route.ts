import { randomUUID } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import { cloudinaryConfigured, cloudinarySignature } from "@/lib/cloudinary";
import GalleryImage from "@/models/GalleryImage";

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  return mime === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb();
    const images = await GalleryImage.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    return Response.json({ images: images.map((image) => ({ ...image, _id: String(image._id) })) });
  } catch {
    return Response.json({ error: "Gallery photos could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!cloudinaryConfigured()) return Response.json({ error: "Image uploads are not configured. Add the Cloudinary server credentials." }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const submittedName = String(form.get("name") ?? "").trim();
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !IMAGE_TYPES.has(file.type)) return Response.json({ error: "Choose a JPG, PNG, or WebP photo up to 5 MB." }, { status: 400 });
    if (submittedName.length > 120) return Response.json({ error: "Photo caption must be 120 characters or fewer." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidSignature(bytes, file.type)) return Response.json({ error: "This file is not a valid JPG, PNG, or WebP image." }, { status: 400 });

    await connectDb();
    const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
    const key = process.env.CLOUDINARY_API_KEY!;
    const secret = process.env.CLOUDINARY_API_SECRET!;
    const folder = "SboshsNailStudio/Gallery";
    const publicId = `${folder}/${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = cloudinarySignature({ asset_folder: folder, public_id: publicId, timestamp });
    const body = new FormData();
    body.set("file", new Blob([bytes], { type: file.type }), file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100));
    body.set("public_id", publicId);
    body.set("asset_folder", folder);
    body.set("timestamp", timestamp);
    body.set("api_key", key);
    body.set("signature", signature);
    const upload = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, {
      method: "POST",
      headers: { authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
      body,
    });
    if (!upload.ok) return Response.json({ error: "Cloudinary could not accept this photo." }, { status: 502 });
    const result = await upload.json() as { secure_url?: string; public_id?: string };
    if (!result.secure_url?.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`) || result.public_id !== publicId) return Response.json({ error: "The uploaded photo could not be verified." }, { status: 502 });

    const displayOrder = await GalleryImage.countDocuments({ active: true });
    const image = await GalleryImage.create({ name: submittedName || "Studio photo", image: result.secure_url, imagePublicId: publicId, displayOrder });
    return Response.json({ image: { ...image.toObject(), _id: String(image._id) } }, { status: 201 });
  } catch {
    return Response.json({ error: "Photo could not be uploaded." }, { status: 503 });
  }
}
