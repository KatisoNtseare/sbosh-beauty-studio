import { businessProfile } from "@/lib/brand";

export type BookingMessageType = "BOOKING_CONFIRMATION" | "REJECTION_NOTIFICATION" | "THANK_YOU";
export type ServiceFields = { name: string; description: string; fullDescription: string; category: string; priceLabel: string; minimumPrice?: number; maximumPrice?: number; durationMinutes?: number; displayOrder: number; active: boolean };
export type CustomerFields = { name: string; phone: string; email?: string; description: string };

export function normalizeSouthAfricanPhone(input: string) {
  let phone = input.replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(phone)) phone = `+27${phone.slice(1)}`;
  else if (/^27\d{9}$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

export function messageTypeForStatus(status: string): BookingMessageType | null {
  if (status === "APPROVED") return "BOOKING_CONFIRMATION";
  if (status === "REJECTED") return "REJECTION_NOTIFICATION";
  if (status === "COMPLETED") return "THANK_YOU";
  return null;
}

export function validateCustomerFields(input: Record<string, unknown>): CustomerFields | null {
  const name = String(input.name ?? "").trim();
  const phone = normalizeSouthAfricanPhone(String(input.phone ?? ""));
  const email = String(input.email ?? "").trim();
  const description = String(input.description ?? "").trim();
  if (name.length < 2 || name.length > 120 || !phone || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || description.length < 1 || description.length > 5000) return null;
  return { name, phone, ...(email ? { email } : {}), description };
}

export function canTransitionBooking(status: string, action: string) {
  if (["approve", "reject"].includes(action)) return status === "PENDING";
  if (["complete", "reschedule"].includes(action)) return status === "APPROVED";
  if (action === "cancel") return status === "PENDING" || status === "APPROVED";
  if (action === "mark-sent") return messageTypeForStatus(status) !== null;
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
  const priceLabel = String(body.priceLabel ?? "").trim();
  const minimumPrice = body.minimumPrice === "" || body.minimumPrice == null ? undefined : Number(body.minimumPrice);
  const maximumPrice = body.maximumPrice === "" || body.maximumPrice == null ? undefined : Number(body.maximumPrice);
  const durationMinutes = body.durationMinutes === "" || body.durationMinutes == null ? undefined : Number(body.durationMinutes);
  const displayOrder = body.displayOrder == null ? 0 : Number(body.displayOrder);
  if (name.length < 2 || name.length > 100 || description.length > 500 || fullDescription.length > 3000 || category.length > 80 || priceLabel.length > 100 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000 || (minimumPrice !== undefined && (!Number.isFinite(minimumPrice) || minimumPrice < 0)) || (maximumPrice !== undefined && (!Number.isFinite(maximumPrice) || maximumPrice < 0)) || (minimumPrice !== undefined && maximumPrice !== undefined && maximumPrice < minimumPrice) || (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600))) return null;
  return { name, description, fullDescription, category, priceLabel, minimumPrice, maximumPrice, durationMinutes, displayOrder, active: body.active !== false };
}

export function snapshotService(service: Record<string, unknown>) {
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
    durationMinutes: service.durationMinutes,
  };
}

export function serviceRemovalAction(hasHistoricalBookings: boolean) {
  return hasHistoricalBookings ? "archive" : "delete";
}

export function buildWhatsAppMessage(booking: {
  customer: { name: string };
  service: { name: string };
  reference: string;
  confirmedDate?: string;
  confirmedStart?: string;
  preferredDate?: string;
  rejectionReason?: string;
}, type: BookingMessageType) {
  if (type === "BOOKING_CONFIRMATION") return `Hello ${booking.customer.name}! 💗\n\nGood news! Your booking request at ${businessProfile.name} has been approved.\n\nService: ${booking.service.name}\nAppointment Date: ${booking.confirmedDate}\nAppointment Time: ${booking.confirmedStart}\nBooking Reference: ${booking.reference}\n\nWe look forward to welcoming you!\n\nThank you for choosing ${businessProfile.name}. ❤️`;
  if (type === "REJECTION_NOTIFICATION") return `Hello ${booking.customer.name}.\n\nThank you for considering ${businessProfile.name}.\n\nUnfortunately, we are unable to accommodate your booking request for ${booking.service.name} on ${booking.preferredDate}.\n\nReason: ${booking.rejectionReason || "Please contact us to discuss alternative availability."}\n\nPlease feel free to contact us so we can discuss alternatives.\n\nThank you for understanding. ❤️`;
  return `Hello ${booking.customer.name}! 💕\n\nThank you for choosing ${businessProfile.name}.\n\nWe hope you loved your experience and are happy with your results!\n\nWe truly appreciate your support and look forward to seeing you again.\n\nMuch love,\n${businessProfile.name} ❤️`;
}

export function whatsappUrl(phone: string, message: string) {
  const normalized = normalizeSouthAfricanPhone(phone);
  if (!normalized) throw new Error("A valid international phone number is required.");
  return `https://wa.me/${normalized.slice(1)}?text=${encodeURIComponent(message)}`;
}
