import mongoose from "mongoose";
import type { CatalogueExtra, ExtraSelection } from "@/lib/catalogue-pricing";
import { calculateCatalogueTotal, calculateExtraLines } from "@/lib/catalogue-pricing";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";

type PricedService = {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  price?: number;
  priceConfirmed?: boolean;
  durationMinutes?: number;
  durationConfirmed?: boolean;
  extras?: CatalogueExtra[];
  active?: boolean;
  image?: string;
  description?: string;
  fullDescription?: string;
  category?: string;
  classification?: string;
};

export function buildServiceQuote(service: PricedService, selections: ExtraSelection[]) {
  if (service.active === false) throw new Error("That service is no longer available.");
  const extras = calculateExtraLines(service.extras ?? [], selections);
  const basePrice = service.priceConfirmed && typeof service.price === "number" ? service.price : null;
  const totalPrice = calculateCatalogueTotal(basePrice, extras.map((line) => line.subtotal));
  const durationMinutes = service.durationConfirmed === true && typeof service.durationMinutes === "number"
    ? service.durationMinutes + extras.reduce((sum, line) => sum + line.durationMinutes * line.quantity, 0)
    : undefined;
  return {
    service: {
      id: service._id,
      name: service.name,
      description: service.description ?? "",
      fullDescription: service.fullDescription ?? "",
      image: service.image || "/images/hero.jpg",
      price: service.price,
      priceConfirmed: basePrice !== null,
      category: service.category ?? "Nail care",
      classification: service.classification,
      durationMinutes,
      components: [],
      isPackage: false,
    },
    extras,
    totalPrice,
    priceNeedsConfirmation: totalPrice === null,
    durationMinutes,
  };
}

export function validatePackageFields(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const displayOrder = body.displayOrder == null ? 0 : Number(body.displayOrder);
  const additionalDurationMinutes = body.additionalDurationMinutes == null || body.additionalDurationMinutes === "" ? 0 : Number(body.additionalDurationMinutes);
  if (name.length < 3 || name.length > 120 || description.length > 1000 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000 || !Number.isInteger(additionalDurationMinutes) || additionalDurationMinutes < 0 || additionalDurationMinutes > 240 || !Array.isArray(body.serviceIds) || body.serviceIds.length < 2 || body.serviceIds.length > 8) return null;
  const serviceIds = body.serviceIds.map(String);
  if (serviceIds.some((id) => !mongoose.isValidObjectId(id)) || new Set(serviceIds.map((id) => id.toLowerCase())).size !== serviceIds.length) return null;
  return { name, description, displayOrder, additionalDurationMinutes, active: body.active !== false, serviceIds };
}

export async function buildPackageQuote(servicePackage: {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  description?: string;
  image?: string;
  additionalDurationMinutes?: number;
  serviceIds?: unknown[];
}, components: PricedService[], selections: ExtraSelection[]) {
  if (!components.length || components.some((component) => component.active === false)) throw new Error("This package is no longer available.");
  const allowedExtras = components.flatMap((component) => (component.extras ?? []).map((extra) => ({
    ...extra,
    key: `${String(component._id)}:${extra.key}`,
    componentId: String(component._id),
    componentName: component.name,
  })));
  const selected = calculateExtraLines(allowedExtras, selections).map((line) => {
    const extra = allowedExtras.find((item) => item.key === line.key)!;
    return { ...line, componentId: extra.componentId, componentName: extra.componentName };
  });
  const prices = components.map((component) => component.priceConfirmed && typeof component.price === "number" ? component.price : null);
  const basePrice = prices.some((price) => price === null) ? null : prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);
  const totalPrice = calculateCatalogueTotal(basePrice, selected.map((line) => line.subtotal));
  const durationMinutes = components.every((component) => component.durationConfirmed === true && Number.isInteger(component.durationMinutes) && Number(component.durationMinutes) > 0)
    ? components.reduce((sum, component) => sum + Number(component.durationMinutes), Number(servicePackage.additionalDurationMinutes ?? 0)) + selected.reduce((sum, line) => sum + line.durationMinutes * line.quantity, 0)
    : undefined;
  return {
    service: {
      id: servicePackage._id,
      name: servicePackage.name,
      description: servicePackage.description ?? "",
      fullDescription: components.map((component) => component.name).join(" + "),
      image: servicePackage.image || components[0]?.image || "/images/hero.jpg",
      category: "Combination Packages",
      price: basePrice ?? undefined,
      priceConfirmed: basePrice !== null,
      durationMinutes,
      isPackage: true,
      components: components.map((component) => ({ id: component._id, name: component.name, price: component.priceConfirmed ? component.price : undefined, durationMinutes: component.durationMinutes })),
    },
    extras: selected,
    totalPrice,
    priceNeedsConfirmation: totalPrice === null,
    durationMinutes,
  };
}

export async function loadCatalogueQuote(input: { serviceId?: string; packageId?: string; extras?: ExtraSelection[] }) {
  const serviceId = input.serviceId?.trim() ?? "";
  const packageId = input.packageId?.trim() ?? "";
  if (Boolean(serviceId) === Boolean(packageId)) throw new Error("Choose one service or package.");
  if ((serviceId && !mongoose.isValidObjectId(serviceId)) || (packageId && !mongoose.isValidObjectId(packageId))) throw new Error("Choose a valid service or package.");
  const selections = input.extras ?? [];
  if (serviceId) {
    const service = await Service.findOne({ _id: serviceId, active: true }).lean();
    if (!service) throw new Error("That service is no longer available.");
    return buildServiceQuote(service as unknown as PricedService, selections);
  }
  const item = await ServicePackage.findOne({ _id: packageId, active: true }).lean();
  if (!item) throw new Error("That package is no longer available.");
  const components = await Service.find({ _id: { $in: item.serviceIds }, active: true }).lean();
  if (components.length !== item.serviceIds.length) throw new Error("This package has services that are no longer available.");
  return buildPackageQuote(item as unknown as Parameters<typeof buildPackageQuote>[0], components as unknown as PricedService[], selections);
}
