export type ServiceClassification = "LASHES" | "NAILS" | "TOES" | "GENERAL";
export type ServiceFields = { name: string; description: string; fullDescription: string; category: string; classification: ServiceClassification; priceLabel: string; minimumPrice?: number; maximumPrice?: number; displayOrder: number; active: boolean };
export type CustomerFields = { name: string; phone?: string; email: string; description: string };

export function classifyService(category: unknown, name: unknown): ServiceClassification {
  const source = (String(category ?? "") + " " + String(name ?? "")).toLowerCase();
  if (/lash|eyelash/.test(source)) return "LASHES";
  if (/toe|pedicure/.test(source)) return "TOES";
  if (/nail|manicure|gel|overlay|buff|acrylic/.test(source)) return "NAILS";
  return "GENERAL";
}

export function resolveAppointmentDuration(classification: unknown): number {
  return classification === "LASHES" ? 45 : 120;
}

export function validateCustomerFields(input: Record<string, unknown>): CustomerFields | null {
  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const description = String(input.description ?? "").trim();
  if (name.length < 2 || name.length > 120 || phone.length > 30 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || description.length > 5000) return null;
  return { name, ...(phone ? { phone } : {}), email, description };
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
  const displayOrder = body.displayOrder == null ? 0 : Number(body.displayOrder);
  if (name.length < 2 || name.length > 100 || description.length > 500 || fullDescription.length > 3000 || category.length > 80 || priceLabel.length > 100 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000 || (minimumPrice !== undefined && (!Number.isFinite(minimumPrice) || minimumPrice < 0)) || (maximumPrice !== undefined && (!Number.isFinite(maximumPrice) || maximumPrice < 0)) || (minimumPrice !== undefined && maximumPrice !== undefined && maximumPrice < minimumPrice)) return null;
  return { name, description, fullDescription, category, classification, priceLabel, minimumPrice, maximumPrice, displayOrder, active: body.active !== false };
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
    minimumPrice: service.minimumPrice,
    maximumPrice: service.maximumPrice,
    category: service.category,
    classification,
    durationMinutes: resolveAppointmentDuration(classification),
  };
}

export function serviceRemovalAction(hasHistoricalBookings: boolean) {
  return hasHistoricalBookings ? "archive" : "delete";
}
