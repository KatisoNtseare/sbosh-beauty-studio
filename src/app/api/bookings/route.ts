import { randomBytes } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { slotsFor, validCalendarDate, validDate, minute } from "@/lib/availability";
import Booking from "@/models/Booking";
import { validateCustomerFields } from "@/lib/domain";
import { loadCatalogueQuote } from "@/lib/catalogue";
import { bookingSubmissionFingerprint, sameBookingSubmission } from "@/lib/idempotency";
import { requestIp, withinRateLimit } from "@/lib/rate-limit";
import { nextBookingReference } from "@/lib/booking-reference";
import { adminNotificationRecipient, sendNotification } from "@/lib/email";

export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  let idempotencyKey = "";
  try {
    await connectDb();
    if (!(await withinRateLimit("public-booking", requestIp(request), 5))) return Response.json({ error: "Please wait a minute before trying again." }, { status: 429 });
    body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check your details and try again." }, { status: 400 });
    const customer = validateCustomerFields(body);
    if (!customer) return Response.json({ error: "Enter your full name and a valid email. Phone and appointment notes are optional." }, { status: 400 });
    const date = String(body.date ?? ""); const time = String(body.time ?? "");
    const serviceId = String(body.serviceId ?? ""); const packageId = String(body.packageId ?? "");
    const extras = body.extras === undefined ? [] : body.extras;
    const submittedKey = request.headers.get("idempotency-key")?.trim();
    if (submittedKey && !/^[A-Za-z0-9._:-]{8,128}$/.test(submittedKey)) return Response.json({ error: "Invalid submission key." }, { status: 400 });
    if (!validCalendarDate(date) || !/^\d{2}:\d{2}$/.test(time) || minute(time) < 0 || Boolean(serviceId) === Boolean(packageId) || !Array.isArray(extras) || extras.length > 20) return Response.json({ error: "Choose a valid preferred date, time and service or package." }, { status: 400 });
    idempotencyKey = submittedKey || randomBytes(16).toString("hex");
    const submitted = { customer, ...(packageId ? { packageId } : { serviceId }), extras: extras as { key: string; quantity: number }[], date, time };
    const secret = process.env.AUTH_SECRET ?? "";
    const fingerprint = bookingSubmissionFingerprint(submitted, secret);
    const prior = await Booking.findOne({ idempotencyKey }).select("+idempotencyFingerprint").lean();
    if (prior) {
      if (!sameBookingSubmission(prior, fingerprint, submitted, secret)) return Response.json({ error: "This submission key was already used for different booking details." }, { status: 409 });
      return Response.json({ reference: prior.reference, status: prior.status }, { status: 200 });
    }
    if (!validDate(date)) return Response.json({ error: "Choose a valid future date." }, { status: 400 });
    let quote;
    try { quote = await loadCatalogueQuote({ serviceId, packageId, extras: submitted.extras }); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Choose an available service." }, { status: 400 }); }
    if (!quote.durationMinutes) return Response.json({ error: "The studio has not configured an appointment length for this option yet. Please contact the studio to request it." }, { status: 409 });
    if (!(await slotsFor(date, quote.durationMinutes)).includes(time)) return Response.json({ error: "That preferred time is no longer available. Choose another time." }, { status: 409 });
    const recipient = adminNotificationRecipient();
    const reference = await nextBookingReference();
    const booking = await Booking.create({
      reference, customer, service: quote.service, extras: quote.extras, totalPrice: quote.totalPrice, priceNeedsConfirmation: quote.priceNeedsConfirmation,
      description: customer.description, preferredDate: date, preferredTime: time,
      idempotencyKey, idempotencyFingerprint: fingerprint,
      notifications: [{ type: "ADMIN_NEW_BOOKING", recipient, subject: "New booking request · " + reference, status: "PENDING", attemptCount: 0 }],
      history: [{ status: "PENDING", at: new Date(), by: "customer" }],
    });
    const notice = booking.notifications[0];
    const delivery = await sendNotification(String(booking._id), String(notice._id));
    return Response.json({
      reference: booking.reference,
      status: booking.status,
      totalPrice: booking.totalPrice,
      priceNeedsConfirmation: booking.priceNeedsConfirmation,
      emailStatus: delivery.sent ? "SENT" : "FAILED",
      message: delivery.sent ? undefined : "Your request is saved and awaiting review. Email delivery is delayed; the studio has been notified in the admin dashboard.",
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      if (idempotencyKey && body) {
        const prior = await Booking.findOne({ idempotencyKey }).select("+idempotencyFingerprint").lean();
        if (prior) {
          const customer = validateCustomerFields(body);
          const submitted = customer ? { customer, ...(String(body.packageId ?? "") ? { packageId: String(body.packageId) } : { serviceId: String(body.serviceId ?? "") }), extras: Array.isArray(body.extras) ? body.extras as { key: string; quantity: number }[] : [], date: String(body.date ?? ""), time: String(body.time ?? "") } : null;
          if (submitted && sameBookingSubmission(prior, bookingSubmissionFingerprint(submitted, process.env.AUTH_SECRET ?? ""), submitted, process.env.AUTH_SECRET ?? "")) return Response.json({ reference: prior.reference, status: prior.status }, { status: 200 });
          return Response.json({ error: "This submission key was already used for different booking details." }, { status: 409 });
        }
      }
    }
    return Response.json({ error: "We couldn’t save your request. Please try again." }, { status: 503 });
  }
}
