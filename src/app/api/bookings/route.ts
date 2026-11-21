import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { calculateBookingReservation, MAX_BOOKING_DURATION_MESSAGE, slotsFor, validCalendarDate, validDate, minute } from "@/lib/availability";
import Booking from "@/models/Booking";
import Availability from "@/models/Availability";
import { validateCustomerFields } from "@/lib/domain";
import { loadCatalogueQuote } from "@/lib/catalogue";
import { bookingSubmissionFingerprint, sameBookingSubmission, type BookingLineSubmission, type BookingSubmission } from "@/lib/idempotency";
import { requestIp, withinRateLimit } from "@/lib/rate-limit";
import { nextBookingReference } from "@/lib/booking-reference";
import { releaseInterval, reserveInterval } from "@/lib/reservations";
import { sendBookingEmail } from "@/lib/booking-email";

function parseItems(body: Record<string, unknown>): BookingLineSubmission[] | null {
  const source = body.items === undefined
    ? [{ ...(typeof body.serviceId === "string" ? { serviceId: body.serviceId } : {}), ...(typeof body.packageId === "string" ? { packageId: body.packageId } : {}), extras: body.extras ?? [] }]
    : body.items;
  if (!Array.isArray(source) || source.length < 1 || source.length > 8) return null;
  let extraCount = 0;
  const items: BookingLineSubmission[] = [];
  for (const value of source) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const item = value as Record<string, unknown>;
    const serviceId = typeof item.serviceId === "string" ? item.serviceId.trim() : "";
    const packageId = typeof item.packageId === "string" ? item.packageId.trim() : "";
    if (Boolean(serviceId) === Boolean(packageId) || (serviceId && !mongoose.isValidObjectId(serviceId)) || (packageId && !mongoose.isValidObjectId(packageId)) || !Array.isArray(item.extras)) return null;
    extraCount += item.extras.length;
    if (extraCount > 20) return null;
    items.push({ ...(serviceId ? { serviceId } : { packageId }), extras: item.extras as { key: string; quantity: number }[] });
  }
  return items;
}

function submissionFor(customer: NonNullable<ReturnType<typeof validateCustomerFields>>, items: BookingLineSubmission[], date: string, time: string): BookingSubmission {
  if (items.length === 1) return { customer, ...items[0], date, time };
  return { customer, items, date, time };
}

export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  let submitted: BookingSubmission | null = null;
  let idempotencyKey = "";
  let reservationDate = "";
  let reservationId: mongoose.Types.ObjectId | null = null;
  let bookingSaved = false;
  try {
    await connectDb();
    if (!(await withinRateLimit("public-booking", requestIp(request), 5))) return Response.json({ error: "Please wait a minute before trying again." }, { status: 429 });
    body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check your details and try again." }, { status: 400 });
    const customer = validateCustomerFields(body);
    if (!customer) return Response.json({ error: "Enter your full name, a valid contact number and a valid email address." }, { status: 400 });
    const date = String(body.date ?? "");
    const time = String(body.time ?? "");
    const items = parseItems(body);
    const submittedKey = request.headers.get("idempotency-key")?.trim();
    if (submittedKey && !/^[A-Za-z0-9._:-]{8,128}$/.test(submittedKey)) return Response.json({ error: "Invalid submission key." }, { status: 400 });
    if (!validCalendarDate(date) || !/^\d{2}:\d{2}$/.test(time) || minute(time) < 0 || !items) return Response.json({ error: "Choose a valid preferred date, time and service or package." }, { status: 400 });
    idempotencyKey = submittedKey || randomBytes(16).toString("hex");
    submitted = submissionFor(customer, items, date, time);
    const secret = process.env.AUTH_SECRET ?? "";
    const fingerprint = bookingSubmissionFingerprint(submitted, secret);
    const prior = await Booking.findOne({ idempotencyKey }).select("+idempotencyFingerprint").lean();
    if (prior) {
      if (!sameBookingSubmission(prior, fingerprint, submitted, secret)) return Response.json({ error: "This submission key was already used for different booking details." }, { status: 409 });
      return Response.json({ reference: prior.reference, status: prior.status, customerEmailSent: prior.notifications?.some((item: { type: string; status: string }) => item.type === "CUSTOMER_REQUEST_RECEIVED" && item.status === "SENT") === true }, { status: 200 });
    }
    if (!validDate(date)) return Response.json({ error: "Choose a valid future date." }, { status: 400 });
    let quote;
    try { quote = await loadCatalogueQuote({ items }); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Choose available services." }, { status: 400 }); }
    const settings = await Availability.findOne().select("slotMinutes bufferMinutes").lean();
    const reservation = calculateBookingReservation();
    if (!reservation) return Response.json({ error: "Choose an available service." }, { status: 400 });
    if (reservation.exceedsMaximum) return Response.json({ error: MAX_BOOKING_DURATION_MESSAGE }, { status: 400 });
    const reservationDuration = reservation.minutes;
    if (!(await slotsFor(date, reservationDuration)).includes(time)) return Response.json({ error: "That appointment time is no longer available. Choose another time." }, { status: 409 });

    reservationId = new mongoose.Types.ObjectId();
    reservationDate = date;
    const buffer = Number(settings?.bufferMinutes || 0);
    const start = minute(time);
    if (!(await reserveInterval(date, reservationId, start, start + reservationDuration, buffer))) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const concurrent = await Booking.findOne({ idempotencyKey }).select("+idempotencyFingerprint").lean();
        if (concurrent) {
          if (sameBookingSubmission(concurrent, fingerprint, submitted, secret)) return Response.json({ reference: concurrent.reference, status: concurrent.status, customerEmailSent: concurrent.notifications?.some((item: { type: string; status: string }) => item.type === "CUSTOMER_REQUEST_RECEIVED" && item.status === "SENT") === true }, { status: 200 });
          return Response.json({ error: "This submission key was already used for different booking details." }, { status: 409 });
        }
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      return Response.json({ error: "That appointment time was just taken. Choose another time." }, { status: 409 });
    }
    const reference = await nextBookingReference();
    const booking = await Booking.create({
      _id: reservationId,
      reference,
      customer,
      service: quote.service,
      reservationDurationMinutes: reservationDuration,
      items: quote.items,
      extras: quote.extras,
      totalPrice: quote.totalPrice,
      priceNeedsConfirmation: quote.priceNeedsConfirmation,
      description: customer.description,
      preferredDate: date,
      preferredTime: time,
      idempotencyKey,
      idempotencyFingerprint: fingerprint,
      history: [{ status: "PENDING", at: new Date(), by: "customer" }],
    });
    bookingSaved = true;
    const [, customerEmail] = await Promise.all([
      sendBookingEmail(booking._id, "ADMIN_NEW_BOOKING"),
      sendBookingEmail(booking._id, "CUSTOMER_REQUEST_RECEIVED"),
    ]);
    return Response.json({
      reference: booking.reference,
      status: booking.status,
      totalPrice: booking.totalPrice,
      priceNeedsConfirmation: booking.priceNeedsConfirmation,
      service: booking.service,
      items: booking.items,
      extras: booking.extras,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      customerEmailSent: customerEmail.sent,
    }, { status: 201 });
  } catch (error) {
    if (reservationId && !bookingSaved) await releaseInterval(reservationDate, reservationId).catch(() => undefined);
    if (error && typeof error === "object" && "code" in error && error.code === 11000 && idempotencyKey && submitted) {
      const prior = await Booking.findOne({ idempotencyKey }).select("+idempotencyFingerprint").lean();
      if (prior && sameBookingSubmission(prior, bookingSubmissionFingerprint(submitted, process.env.AUTH_SECRET ?? ""), submitted, process.env.AUTH_SECRET ?? "")) return Response.json({ reference: prior.reference, status: prior.status, customerEmailSent: prior.notifications?.some((item: { type: string; status: string }) => item.type === "CUSTOMER_REQUEST_RECEIVED" && item.status === "SENT") === true }, { status: 200 });
      if (prior) return Response.json({ error: "This submission key was already used for different booking details." }, { status: 409 });
    }
    return Response.json({ error: "We couldn’t save your request. Please try again." }, { status: 503 });
  }
}
