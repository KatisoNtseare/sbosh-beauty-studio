import { connectDb } from "@/lib/mongodb";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import { calculatePackagePrice } from "@/lib/catalogue-pricing";
import type { Types } from "mongoose";

type ServiceRow = { _id: Types.ObjectId; name: string; description?: string; fullDescription?: string; image?: string; price?: number; priceConfirmed?: boolean; durationMinutes?: number; durationConfirmed?: boolean; extras?: { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN"; durationMinutes?: number }[]; category?: string; displayOrder?: number };
type PackageRow = { _id: Types.ObjectId; name: string; description?: string; image?: string; serviceIds: Types.ObjectId[]; additionalDurationMinutes?: number; displayOrder?: number };

export async function GET() {
  try {
    await connectDb();
    const [services, packages] = await Promise.all([
      Service.find({ active: true }).select("name description fullDescription image price priceConfirmed priceLabel minimumPrice maximumPrice durationMinutes durationConfirmed extras classification category displayOrder").sort({ displayOrder: 1, name: 1 }).lean(),
      ServicePackage.find({ active: true }).sort({ displayOrder: 1, name: 1 }).lean(),
    ]);
    const serviceRows = services as unknown as ServiceRow[];
    const packageRows = packages as unknown as PackageRow[];
    const serviceById = new Map(serviceRows.map((service) => [String(service._id), service]));
    const packageOptions = packageRows.flatMap((item) => {
      const components = item.serviceIds.map((id: Types.ObjectId) => serviceById.get(String(id))).filter((value): value is ServiceRow => Boolean(value));
      if (components.length !== item.serviceIds.length) return [];
      const price = calculatePackagePrice(components.map((component) => component.priceConfirmed && typeof component.price === "number" ? component.price : null));
      const durationConfigured = components.every((component) => component.durationConfirmed === true && Number.isInteger(component.durationMinutes) && Number(component.durationMinutes) > 0);
      const extras = components.flatMap((component) => (component.extras ?? []).map((extra) => ({ ...extra, key: `${String(component._id)}:${extra.key}`, componentId: String(component._id), componentName: component.name })));
      return [{
        _id: String(item._id), name: item.name, description: item.description, image: item.image || components[0]?.image || "/images/hero.jpg",
        category: "Combination Packages", isPackage: true,
        price, priceConfirmed: price !== null,
        durationMinutes: durationConfigured ? components.reduce((total, component) => total + Number(component.durationMinutes), item.additionalDurationMinutes ?? 0) : undefined,
        serviceIds: components.map((component) => String(component._id)),
        components: components.map((component) => ({ _id: String(component._id), name: component.name, price: component.priceConfirmed ? component.price : undefined, priceConfirmed: component.priceConfirmed, durationMinutes: component.durationMinutes })),
        extras, displayOrder: item.displayOrder,
      }];
    });
    return Response.json({ services: serviceRows.map((item) => ({ ...item, _id: String(item._id), image: item.image || "/images/hero.jpg", durationMinutes: item.durationConfirmed ? item.durationMinutes : undefined, isPackage: false })), packages: packageOptions });
  } catch {
    return Response.json({ error: "Services are temporarily unavailable." }, { status: 503 });
  }
}
