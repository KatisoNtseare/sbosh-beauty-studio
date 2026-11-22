import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import { cloudinaryPublicId, destroyCloudinaryImage } from "@/lib/cloudinary";
import GalleryImage from "@/models/GalleryImage";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid gallery photo." }, { status: 400 });
    await connectDb();
    const image = await GalleryImage.findByIdAndDelete(id);
    if (!image) return Response.json({ error: "Gallery photo not found." }, { status: 404 });
    const removedFromStorage = cloudinaryPublicId(image.imagePublicId) ? await destroyCloudinaryImage(image.imagePublicId).catch(() => false) : false;
    return Response.json({ deleted: true, storageWarning: !removedFromStorage });
  } catch {
    return Response.json({ error: "Gallery photo could not be removed." }, { status: 503 });
  }
}
