import { connectDb } from "@/lib/mongodb";
import GalleryImage from "@/models/GalleryImage";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import { defaultCatalogueImage } from "@/lib/brand";

const isRealPhoto = (image?: string) => Boolean(image && image !== defaultCatalogueImage && image !== "/images/hero.jpg");

export async function GET() {
  try {
    await connectDb();
    const [gallery, services, packages] = await Promise.all([
      GalleryImage.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
      Service.find({ active: true }).select("name image").sort({ displayOrder: 1, name: 1 }).lean(),
      ServicePackage.find({ active: true }).select("name image").sort({ displayOrder: 1, name: 1 }).lean(),
    ]);
    const photos = [
      ...gallery.map((photo) => ({ _id: String(photo._id), name: photo.name, image: photo.image })),
      ...[...services, ...packages].filter((item) => isRealPhoto(item.image)).map((item) => ({ _id: String(item._id), name: item.name, image: item.image })),
    ];
    const seen = new Set<string>();
    return Response.json({ images: photos.filter((photo) => {
      if (seen.has(photo.image)) return false;
      seen.add(photo.image);
      return true;
    }) });
  } catch {
    return Response.json({ error: "Studio photos are temporarily unavailable." }, { status: 503 });
  }
}
