import { connectDb } from "@/lib/mongodb";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import { calculatePackagePrice } from "@/lib/catalogue-pricing";
import type { Types } from "mongoose";
import { defaultCatalogueImage } from "@/lib/brand";

const catalogueImage = (image?: string) => image && image !== "/images/hero.jpg" ? image : defaultCatalogueImage;

type ServiceRow = { _id: Types.ObjectId; name: string; description?: string; fullDescription?: string; image?: string; price?: number; priceConfirmed?: boolean; extras?: { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN" }[]; category?: string; displayOrder?: number };
type PackageRow = { _id: Types.ObjectId; name: string; description?: string; image?: string; serviceIds: Types.ObjectId[]; displayOrder?: number };

export async function GET() {
  try {
    await connectDb();
    const [services, packages] = await Promise.all([
      Service.find({ active: true }).select("name description fullDescription image price priceConfirmed priceLabel minimumPrice maximumPrice extras classification category displayOrder").sort({ displayOrder: 1, name: 1 }).lean(),
      ServicePackage.find({ active: true }).sort({ displayOrder: 1, name: 1 }).lean(),
    ]);
    const serviceRows = services as unknown as ServiceRow[];
    const packageRows = packages as unknown as PackageRow[];
    const serviceById = new Map(serviceRows.map((service) => [String(service._id), service]));
    const packageOptions = packageRows.flatMap((item) => {
      const components = item.serviceIds.map((id: Types.ObjectId) => serviceById.get(String(id))).filter((value): value is ServiceRow => Boolean(value));
      if (components.length !== item.serviceIds.length) return [];
      const price = calculatePackagePrice(components.map((component) => component.priceConfirmed && typeof component.price === "number" ? component.price : null));
      const extras = components.flatMap((component) => (component.extras ?? []).map((extra) => ({ ...extra, key: `${String(component._id)}:${extra.key}`, componentId: String(component._id), componentName: component.name })));
      return [{
        _id: String(item._id), name: item.name, description: item.description, image: catalogueImage(item.image),
        category: "Combination Packages", isPackage: true,
        price, priceConfirmed: price !== null,
        serviceIds: components.map((component) => String(component._id)),
        components: components.map((component) => ({ _id: String(component._id), name: component.name, price: component.priceConfirmed ? component.price : undefined, priceConfirmed: component.priceConfirmed })),
        extras, displayOrder: item.displayOrder,
      }];
    });
    return Response.json({ services: serviceRows.map((item) => ({ ...item, _id: String(item._id), image: catalogueImage(item.image), isPackage: false })), packages: packageOptions });
  } catch {
    return Response.json({ error: "Services are temporarily unavailable." }, { status: 503 });
  }
}
