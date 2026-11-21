import { randomBytes } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate, minute } from "@/lib/availability";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { snapshotService, validateCustomerFields } from "@/lib/domain";
import { requestIp, withinRateLimit } from "@/lib/rate-limit";
import mongoose from "mongoose";
export async function POST(request: Request) {
  try {
    await connectDb();
    if (!(await withinRateLimit("public-booking", requestIp(request), 5))) return Response.json({ error: "Please wait a minute before trying again." }, { status: 429 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check your details and try again." }, { status: 400 });
    const customer = validateCustomerFields(body);
    if (!customer) return Response.json({ error: "Check your name, WhatsApp number, email and request description." }, { status: 400 });
    const date = String(body.date ?? ""); const time = String(body.time ?? ""); const serviceId = String(body.serviceId ?? "");
    if (!validDate(date) || minute(time) < 0 || !mongoose.isValidObjectId(serviceId)) return Response.json({ error: "Choose a valid preferred date, time and service." }, { status: 400 });
    const service = await Service.findOne({ _id: serviceId, active: true }).lean();
    if (!service) return Response.json({ error: "That service is no longer available." }, { status: 400 });
    if (!service.durationMinutes) return Response.json({ error: "The studio has not configured this service duration yet." }, { status: 409 });
    if (!(await slotsFor(date, service.durationMinutes)).includes(time)) return Response.json({ error: "That preferred time is no longer available. Choose another time." }, { status: 409 });
    const submittedKey = request.headers.get("idempotency-key");
    if (submittedKey && !/^[A-Za-z0-9._:-]{8,128}$/.test(submittedKey)) return Response.json({ error: "Invalid submission key." }, { status: 400 });
    const idempotencyKey = submittedKey || randomBytes(16).toString("hex");
    const prior = await Booking.findOne({ idempotencyKey }).lean();
    if (prior) return Response.json({ reference: prior.reference, status: prior.status }, { status: 200 });
    const ref = `SBS-${new Date().getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}`;
    let booking;
    try { booking = await Booking.create({ reference: ref, customer, service: snapshotService(service), description: customer.description, preferredDate: date, preferredTime: time, idempotencyKey, history: [{ status: "PENDING", at: new Date(), by: "customer" }] }); }
    catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === 11000) {
        const duplicate = await Booking.findOne({ idempotencyKey }).lean();
        if (duplicate) return Response.json({ reference: duplicate.reference, status: duplicate.status }, { status: 200 });
      }
      throw error;
    }
    return Response.json({ reference: booking.reference, status: booking.status }, { status: 201 });
  } catch { return Response.json({ error: "We couldn’t save your request. Please try again." }, { status: 503 }); }
}
