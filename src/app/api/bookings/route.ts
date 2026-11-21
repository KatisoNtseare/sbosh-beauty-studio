import { randomBytes } from "node:crypto";
import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate, minute } from "@/lib/availability";
import Service from "@/models/Service";
import Booking from "@/models/Booking";

const attempts = new Map<string, { count: number; since: number }>();
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(); const window = attempts.get(ip);
  if (window && now - window.since < 60_000 && window.count >= 5) return Response.json({ error: "Please wait a minute before trying again." }, { status: 429 });
  attempts.set(ip, !window || now - window.since >= 60_000 ? { count: 1, since: now } : { ...window, count: window.count + 1 });
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim(); let phone = String(body.phone ?? "").replace(/[^\d+]/g, "");
    if (/^0\d{9}$/.test(phone)) phone = `+27${phone.slice(1)}`;
    else if (/^27\d{9}$/.test(phone)) phone = `+${phone}`;
    const email = String(body.email ?? "").trim(); const description = String(body.description ?? "").trim();
    const date = String(body.date ?? ""); const time = String(body.time ?? ""); const serviceId = String(body.serviceId ?? "");
    if (name.length < 2 || name.length > 120 || !/^\+?[0-9]{8,15}$/.test(phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || description.length < 1 || description.length > 5000 || !validDate(date) || minute(time) < 0 || !serviceId) return Response.json({ error: "Check your details and try again." }, { status: 400 });
    await connectDb();
    const service = await Service.findOne({ _id: serviceId, active: true }).lean();
    if (!service) return Response.json({ error: "That service is no longer available." }, { status: 400 });
    if (!(await slotsFor(date, service.durationMinutes || 30)).includes(time)) return Response.json({ error: "That preferred time is no longer available. Choose another time." }, { status: 409 });
    const idempotencyKey = request.headers.get("idempotency-key") || randomBytes(16).toString("hex");
    const prior = await Booking.findOne({ idempotencyKey }).lean();
    if (prior) return Response.json({ reference: prior.reference, status: prior.status }, { status: 200 });
    const ref = `SB-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const booking = await Booking.create({ reference: ref, customer: { name, phone, email: email || undefined }, service: { id: service._id, name: service.name, description: service.description, priceLabel: service.priceLabel, durationMinutes: service.durationMinutes }, description, preferredDate: date, preferredTime: time, idempotencyKey, history: [{ status: "PENDING", at: new Date(), by: "customer" }] });
    return Response.json({ reference: booking.reference, status: booking.status }, { status: 201 });
  } catch { return Response.json({ error: "We couldn’t save your request. Please try again." }, { status: 503 }); }
}
