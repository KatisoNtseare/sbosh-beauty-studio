export type ServiceClassification = "LASHES" | "NAILS" | "TOES" | "GENERAL";
export type ServiceFields = { name: string; description: string; fullDescription: string; category: string; classification: ServiceClassification; priceLabel: string; price?: number; priceConfirmed: boolean; extras: { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN" }[]; minimumPrice?: number; maximumPrice?: number; displayOrder: number; active: boolean };
export type CustomerFields = { name: string; phone: string; email: string; description: string };

export function classifyService(category: unknown, name: unknown): ServiceClassification {
  const source = (String(category ?? "") + " " + String(name ?? "")).toLowerCase();
  if (/lash|eyelash/.test(source)) return "LASHES";
  if (/toe|pedicure/.test(source)) return "TOES";
  if (/nail|manicure|gel|overlay|buff|acrylic/.test(source)) return "NAILS";
  return "GENERAL";
}

export function validateCustomerFields(input: Record<string, unknown>): CustomerFields | null {
  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const description = String(input.description ?? "").trim();
  if (name.length < 2 || name.length > 120 || phone.length < 7 || phone.length > 30 || !/^[+\d][+\d ()-]{6,29}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || description.length > 5000) return null;
  return { name, phone, email, description };
}

export function canTransitionBooking(status: string, action: string) {
  if (["approve", "reject"].includes(action)) return status === "PENDING";
  if (["complete", "reschedule"].includes(action)) return status === "APPROVED";
  if (action === "cancel") return status === "PENDING" || status === "APPROVED";
  return false;
}

export function hasOverlappingInterval(start: number, end: number, existing: { start: number; end: number }[]) {
  return existing.some((interval) => start < interval.end && end > interval.start);
}

export function validateServiceFields(body: Record<string, unknown>): ServiceFields | null {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const fullDescription = String(body.fullDescription ?? "").trim();
  const category = String(body.category ?? "Nail services").trim();
  const classification = ["LASHES", "NAILS", "TOES", "GENERAL"].includes(String(body.classification))
    ? String(body.classification) as ServiceClassification
    : classifyService(category, name);
  const priceLabel = String(body.priceLabel ?? "").trim();
  const minimumPrice = body.minimumPrice === "" || body.minimumPrice == null ? undefined : Number(body.minimumPrice);
  const maximumPrice = body.maximumPrice === "" || body.maximumPrice == null ? undefined : Number(body.maximumPrice);
  const price = body.price === "" || body.price == null ? undefined : Number(body.price);
  const displayOrder = body.displayOrder == null ? 0 : Number(body.displayOrder);
  const rawExtras = body.extras === undefined ? [] : body.extras;
  if (!Array.isArray(rawExtras) || rawExtras.length > 20) return null;
  const extras: ServiceFields["extras"] = [];
  const seen = new Set<string>();
  for (const raw of rawExtras) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    const key = String(item.key ?? "").trim(); const extraName = String(item.name ?? "").trim();
    const unitPrice = Number(item.unitPrice); const method = item.method;
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/i.test(key) || seen.has(key) || extraName.length < 2 || extraName.length > 100 || !Number.isSafeInteger(unitPrice) || unitPrice < 1 || !["PER_NAIL", "PER_DESIGN"].includes(String(method))) return null;
    seen.add(key); extras.push({ key, name: extraName, unitPrice, method: method as "PER_NAIL" | "PER_DESIGN" });
  }
  if (name.length < 2 || name.length > 100 || description.length > 500 || fullDescription.length > 3000 || category.length < 2 || category.length > 80 || priceLabel.length > 100 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000 || (price !== undefined && (!Number.isSafeInteger(price) || price < 1)) || (body.priceConfirmed === true && price === undefined) || (minimumPrice !== undefined && (!Number.isFinite(minimumPrice) || minimumPrice < 0)) || (maximumPrice !== undefined && (!Number.isFinite(maximumPrice) || maximumPrice < 0)) || (minimumPrice !== undefined && maximumPrice !== undefined && maximumPrice < minimumPrice)) return null;
  const priceConfirmed = body.priceConfirmed === true && price !== undefined;
  return { name, description, fullDescription, category, classification, priceLabel, price, priceConfirmed, extras, minimumPrice, maximumPrice, displayOrder, active: body.active !== false };
}

export function snapshotService(service: Record<string, unknown>) {
  const classification = ["LASHES", "NAILS", "TOES", "GENERAL"].includes(String(service.classification))
    ? service.classification as ServiceClassification
    : classifyService(service.category, service.name);
  return {
    id: service._id,
    name: service.name,
    description: service.description,
    fullDescription: service.fullDescription,
    image: service.image,
    priceLabel: service.priceLabel,
    price: typeof service.price === "number" ? service.price : undefined,
    priceConfirmed: service.priceConfirmed === true && typeof service.price === "number",
    minimumPrice: service.minimumPrice,
    maximumPrice: service.maximumPrice,
    category: service.category,
    classification,
    extras: Array.isArray(service.extras) ? service.extras : [],
  };
}

export function serviceRemovalAction(hasHistoricalBookings: boolean) {
  return hasHistoricalBookings ? "archive" : "delete";
}
