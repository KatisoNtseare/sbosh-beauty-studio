import { createHmac } from "node:crypto";
import type { CustomerFields } from "@/lib/domain";

export type BookingLineSubmission = { serviceId?: string; packageId?: string; extras?: { key: string; quantity: number }[] };
export type BookingSubmission = { customer: CustomerFields; serviceId?: string; packageId?: string; extras?: { key: string; quantity: number }[]; items?: BookingLineSubmission[]; date: string; time: string };

export function bookingSubmissionFingerprint(input: BookingSubmission, secret: string) {
  if (secret.length < 32) throw new Error("A server secret is required to scope booking retries.");
  const canonicalInput = {
    name: input.customer.name.trim(),
    phone: input.customer.phone ?? "",
    email: input.customer.email ?? "",
    description: input.customer.description,
    serviceId: input.serviceId?.toLowerCase() ?? "",
    packageId: input.packageId?.toLowerCase() ?? "",
    extras: [...(input.extras ?? [])].sort((a, b) => a.key.localeCompare(b.key)),
    ...(input.items ? { items: input.items.map((item) => ({ serviceId: item.serviceId?.toLowerCase() ?? "", packageId: item.packageId?.toLowerCase() ?? "", extras: [...(item.extras ?? [])].sort((a, b) => a.key.localeCompare(b.key)) })) } : {}),
    date: input.date,
    time: input.time,
  };
  const canonical = JSON.stringify(canonicalInput);
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

export function sameBookingSubmission(booking: {
  idempotencyFingerprint?: string;
  customer: CustomerFields;
  service: { id: unknown; isPackage?: boolean };
  extras?: { key?: string; quantity?: number }[];
  items?: { id: unknown; kind: string }[];
  description: string;
  preferredDate: string;
  preferredTime: string;
}, fingerprint: string, submitted: BookingSubmission, secret: string) {
  const stored = booking.idempotencyFingerprint || bookingSubmissionFingerprint({
    customer: {
      ...booking.customer,
      name: booking.customer.name.trim(),
      phone: booking.customer.phone ?? "",
      description: booking.description,
    },
    ...(booking.items && booking.items.length > 1 ? { items: booking.items.map((item) => ({ ...(item.kind === "package" ? { packageId: String(item.id) } : { serviceId: String(item.id) }) })) } : booking.service.isPackage ? { packageId: String(booking.service.id) } : { serviceId: String(booking.service.id) }),
    extras: (booking.extras ?? []).map((extra) => ({ key: extra.key ?? "", quantity: extra.quantity ?? 0 })),
    date: booking.preferredDate,
    time: booking.preferredTime,
  }, secret);
  return stored === fingerprint && fingerprint === bookingSubmissionFingerprint(submitted, secret);
}
