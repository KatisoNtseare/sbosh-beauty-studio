import { createHmac } from "node:crypto";
import type { CustomerFields } from "@/lib/domain";

export type BookingSubmission = { customer: CustomerFields; serviceId: string; date: string; time: string };

export function bookingSubmissionFingerprint(input: BookingSubmission, secret: string) {
  if (secret.length < 32) throw new Error("A server secret is required to scope booking retries.");
  const canonical = JSON.stringify({
    name: input.customer.name.trim(),
    phone: input.customer.phone ?? "",
    email: input.customer.email ?? "",
    description: input.customer.description,
    serviceId: input.serviceId.toLowerCase(),
    date: input.date,
    time: input.time,
  });
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

export function sameBookingSubmission(booking: {
  idempotencyFingerprint?: string;
  customer: CustomerFields;
  service: { id: unknown };
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
    serviceId: String(booking.service.id),
    date: booking.preferredDate,
    time: booking.preferredTime,
  }, secret);
  return stored === fingerprint && fingerprint === bookingSubmissionFingerprint(submitted, secret);
}
