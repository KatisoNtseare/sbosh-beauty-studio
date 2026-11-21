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
  const extras = calculateExtraLines(service.extras ?? [], selections).map((line) => ({ ...line, componentId: String(service._id), componentName: service.name }));
  const basePrice = service.priceConfirmed && typeof service.price === "number" ? service.price : null;
  const totalPrice = calculateCatalogueTotal(basePrice, extras.map((line) => line.subtotal));
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
      components: [],
      isPackage: false,
    },
    extras,
    totalPrice,
    priceNeedsConfirmation: totalPrice === null,
    componentCount: 1,
  };
}

export function validatePackageFields(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const displayOrder = body.displayOrder == null ? 0 : Number(body.displayOrder);
  if (name.length < 3 || name.length > 120 || description.length > 1000 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000 || !Array.isArray(body.serviceIds) || body.serviceIds.length < 2 || body.serviceIds.length > 8) return null;
  const serviceIds = body.serviceIds.map(String);
  if (serviceIds.some((id) => !mongoose.isValidObjectId(id)) || new Set(serviceIds.map((id) => id.toLowerCase())).size !== serviceIds.length) return null;
  return { name, description, displayOrder, active: body.active !== false, serviceIds };
}

export async function buildPackageQuote(servicePackage: {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  description?: string;
  image?: string;
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
      isPackage: true,
      components: components.map((component) => ({ id: component._id, name: component.name, price: component.priceConfirmed ? component.price : undefined })),
    },
    extras: selected,
    totalPrice,
    priceNeedsConfirmation: totalPrice === null,
    componentCount: components.length,
  };
}

type CatalogueRequest = { serviceId?: string; packageId?: string; extras?: ExtraSelection[] };

async function loadSingleCatalogueQuote(input: CatalogueRequest) {
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

export async function loadCatalogueQuote(input: CatalogueRequest & { items?: unknown[] }) {
  if (!input.items) {
    const quote = await loadSingleCatalogueQuote(input);
    return {
      ...quote,
      componentCounts: [quote.componentCount],
      items: [{
        id: quote.service.id,
        kind: quote.service.isPackage ? "package" : "service",
        name: quote.service.name,
        price: quote.service.price,
        priceConfirmed: quote.service.priceConfirmed,
        componentCount: quote.componentCount,
      }],
    };
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 8) throw new Error("Choose between one and eight services or packages.");
  const requests: CatalogueRequest[] = input.items.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("A cart item is invalid.");
    const item = raw as Record<string, unknown>;
    const serviceId = typeof item.serviceId === "string" ? item.serviceId : "";
    const packageId = typeof item.packageId === "string" ? item.packageId : "";
    const extras = item.extras === undefined ? [] : item.extras;
    if (Boolean(serviceId) === Boolean(packageId) || !Array.isArray(extras) || extras.length > 20) throw new Error("A cart item is invalid.");
    return { ...(serviceId ? { serviceId } : { packageId }), extras: extras as ExtraSelection[] };
  });
  const quotes = await Promise.all(requests.map(loadSingleCatalogueQuote));
  const totalPrice = quotes.some((quote) => quote.totalPrice === null) ? null : quotes.reduce((sum, quote) => sum + (quote.totalPrice ?? 0), 0);
  const names = quotes.map((quote) => quote.service.name);
  const items = quotes.map((quote, index) => ({
    id: quote.service.id,
    kind: requests[index].packageId ? "package" : "service",
    name: quote.service.name,
    price: quote.service.price,
    priceConfirmed: quote.service.priceConfirmed,
    componentCount: quote.componentCount,
  }));
  if (quotes.length === 1) return { ...quotes[0], componentCounts: [quotes[0].componentCount], items };
  return {
    service: {
      id: quotes[0].service.id,
      name: names.join(" + "),
      description: "",
      fullDescription: names.join(" + "),
      image: quotes[0].service.image,
      price: totalPrice ?? undefined,
      priceConfirmed: totalPrice !== null,
      category: "Booking selection",
      components: quotes.flatMap((quote) => quote.service.components.length ? quote.service.components : [{ id: quote.service.id, name: quote.service.name, price: quote.service.price }]),
      isPackage: false,
    },
    extras: quotes.flatMap((quote) => quote.extras),
    totalPrice,
    priceNeedsConfirmation: totalPrice === null,
    componentCounts: quotes.map((quote) => quote.componentCount),
    items,
  };
}
