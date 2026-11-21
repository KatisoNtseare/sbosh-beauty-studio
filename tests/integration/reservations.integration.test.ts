import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({ value: "", queue: [] as string[] }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => {
    const value = sessionState.queue.shift() || sessionState.value;
    return name === "sbosh_admin" && value ? { value } : undefined;
  } }),
}));

import { connectDb } from "@/lib/mongodb";
import { adminCookieValue } from "@/lib/admin-auth";
import { reserveInterval } from "@/lib/reservations";
import Booking from "@/models/Booking";
import Availability from "@/models/Availability";
import RateLimit from "@/models/RateLimit";
import ReservationDay from "@/models/ReservationDay";
import Service from "@/models/Service";
import { POST as submitBooking } from "@/app/api/bookings/route";
import { PATCH as updateBooking } from "@/app/api/admin/bookings/[id]/route";
import { PATCH as updateService } from "@/app/api/admin/services/route";
import { GET as getPublicServices } from "@/app/api/services/route";

const cleanupBookingIds: mongoose.Types.ObjectId[] = [];
const reservationDates: string[] = [];
const rateLimitIds = new Set<string>();
const defaultServiceNames = ["Manicure", "Gel Nails", "Overlay", "Nail Repair", "Buff & Shine"];
const admin = { id: new mongoose.Types.ObjectId().toString(), email: "integration@example.test", name: "Integration Admin" };
let service: mongoose.HydratedDocument<InstanceType<typeof Service>>;
let availabilityId: mongoose.Types.ObjectId;
let safeToCleanup = false;
let dayCounter = 1;
let ipCounter = 30;

function nextDate() {
  return `2099-02-${String(dayCounter++).padStart(2, "0")}`;
}

function bookingBody(date: string, time = "10:00") {
  return {
    name: "Integration Customer",
    phone: "081 317 9144",
    email: "customer@example.test",
    description: "A detailed integration test request",
    date,
    time,
    serviceId: service._id.toString(),
  };
}

async function postBooking(body: ReturnType<typeof bookingBody>, key: string) {
  const ip = `198.51.100.${ipCounter++}`;
  const window = Math.floor(Date.now() / 60_000);
  rateLimitIds.add(`public-booking:${window}:${createHash("sha256").update(ip).digest("hex")}`);
  const response = await submitBooking(new Request("http://localhost/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": key, "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }));
  const result = await response.json();
  if (result.reference) {
    const saved = await Booking.findOne({ reference: result.reference }).select("_id");
    if (saved) cleanupBookingIds.push(saved._id);
  }
  return { response, result };
}

async function createPending(date: string, time = "10:00") {
  reservationDates.push(date);
  const booking = await Booking.create({
    reference: `IT-${randomUUID()}`,
    customer: { name: "Integration Customer", phone: "+27813179144", email: "customer@example.test" },
    service: { id: service._id, name: service.name, durationMinutes: 60 },
    description: "Integration test booking",
    preferredDate: date,
    preferredTime: time,
    status: "PENDING",
    history: [{ status: "PENDING", at: new Date(), by: "integration-test" }],
  });
  cleanupBookingIds.push(booking._id);
  return booking;
}

async function adminAction(id: string, action: string, extra: Record<string, string> = {}) {
  return updateBooking(new Request(`http://localhost/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  }), { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  await connectDb();
  sessionState.value = adminCookieValue(admin);
  const counts = await Promise.all([
    Booking.countDocuments(), Service.countDocuments(), Availability.countDocuments(),
    ReservationDay.countDocuments(), RateLimit.countDocuments(),
  ]);
  if (counts.some((count) => count !== 0)) {
    throw new Error("The isolated test database must be empty before integration tests run; no records were deleted.");
  }
  safeToCleanup = true;
  await Promise.all([Booking, Service, Availability, ReservationDay, RateLimit].map((model) => model.createIndexes()));

  service = await Service.create({ name: `Integration service ${randomUUID()}`, description: "Test", durationMinutes: 60, active: true });
  const weekly = Array.from({ length: 7 }, (_, weekday) => ({ weekday, enabled: true, periods: [{ open: "09:00", close: "18:00" }] }));
  const availability = await Availability.create({ weekly, exceptions: [], blockedDates: [], blockedPeriods: [], breaks: [], slotMinutes: 30, bufferMinutes: 0, timeZone: "Africa/Johannesburg" });
  availabilityId = availability._id;
});

afterAll(async () => {
  try {
    if (safeToCleanup) {
      if (cleanupBookingIds.length) await Booking.deleteMany({ _id: { $in: cleanupBookingIds } });
      if (reservationDates.length) await ReservationDay.deleteMany({ date: { $in: [...new Set(reservationDates)] } });
      if (availabilityId) await Availability.deleteOne({ _id: availabilityId });
      if (service?._id) await Service.deleteOne({ _id: service._id });
      // These setup records can only have been inserted by the public service route after the empty-DB guard.
      await Service.deleteMany({ name: { $in: defaultServiceNames } });
      if (rateLimitIds.size) await RateLimit.deleteMany({ _id: { $in: [...rateLimitIds] } });
    }
  } finally {
    sessionState.value = "";
    sessionState.queue = [];
    await mongoose.disconnect();
  }
});

describe("MongoDB booking and reservation integration", () => {
  it("replays an idempotent booking before rechecking later availability and rejects key reuse with different details", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const key = `retry-${randomUUID()}`;
    const body = bookingBody(date);
    const first = await postBooking(body, key);
    expect(first.response.status).toBe(201);

    await Availability.updateOne({ _id: availabilityId }, { $push: { blockedPeriods: { date, start: "10:00", end: "11:00" } } });
    const retry = await postBooking(body, key);
    expect(retry.response.status).toBe(200);
    expect(retry.result.reference).toBe(first.result.reference);

    const changed = await postBooking({ ...body, time: "11:00" }, key);
    expect(changed.response.status).toBe(409);
    expect(await ReservationDay.findOne({ date })).toBeNull();
  });

  it("allows one database insert for simultaneous retries with the same key, while separate keys remain pending", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const body = bookingBody(date);
    const key = `parallel-${randomUUID()}`;
    const sameKey = await Promise.all([postBooking(body, key), postBooking(body, key)]);
    expect(sameKey.map(({ response }) => response.status).sort()).toEqual([200, 201]);
    expect(sameKey[0].result.reference).toBe(sameKey[1].result.reference);

    const distinct = await Promise.all([
      postBooking(body, `distinct-a-${randomUUID()}`),
      postBooking(body, `distinct-b-${randomUUID()}`),
    ]);
    expect(distinct.every(({ response }) => response.status === 201)).toBe(true);
    const pending = await Booking.find({ reference: { $in: distinct.map(({ result }) => result.reference) } });
    expect(pending.every((booking) => booking.status === "PENDING")).toBe(true);
    expect(await ReservationDay.findOne({ date })).toBeNull();

    const secondAdmin = { id: new mongoose.Types.ObjectId().toString(), email: "second-admin@example.test", name: "Second Admin" };
    const firstSession = adminCookieValue(admin);
    const secondSession = adminCookieValue(secondAdmin);
    sessionState.queue = [firstSession, secondSession, firstSession, secondSession];
    let approvals: Response[];
    try {
      approvals = await Promise.all(pending.map((booking) => adminAction(booking.id, "approve", { date, time: "10:00" })));
    } finally {
      sessionState.queue = [];
    }
    expect(approvals.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(await Booking.countDocuments({ _id: { $in: pending.map(({ _id }) => _id) }, status: "APPROVED" })).toBe(1);
    expect(await ReservationDay.countDocuments({ date, "reservations.0": { $exists: true } })).toBe(1);
  });

  it("uses atomic database updates for overlapping, adjacent and buffered intervals", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const ids = Array.from({ length: 5 }, () => new mongoose.Types.ObjectId());
    const overlapping = await Promise.all([
      reserveInterval(date, ids[0], 600, 660),
      reserveInterval(date, ids[1], 630, 690),
    ]);
    expect(overlapping.filter(Boolean)).toHaveLength(1);

    const adjacent = await Promise.all([
      reserveInterval(date, ids[2], 720, 780),
      reserveInterval(date, ids[3], 780, 840),
    ]);
    expect(adjacent).toEqual([true, true]);

    const bufferedDate = nextDate();
    reservationDates.push(bufferedDate);
    await Availability.updateOne({ _id: availabilityId }, { $set: { bufferMinutes: 10 } });
    expect(await reserveInterval(bufferedDate, ids[4], 600, 660, 10)).toBe(true);
    expect(await reserveInterval(bufferedDate, new mongoose.Types.ObjectId(), 660, 720, 10)).toBe(false);
    await Availability.updateOne({ _id: availabilityId }, { $set: { bufferMinutes: 0 } });
  });

  it("preserves reservation lifecycle through rejection, cancellation, rescheduling and completion", async () => {
    const rejected = await createPending(nextDate());
    expect(await adminAction(rejected.id, "reject")).toHaveProperty("status", 200);
    expect(await ReservationDay.findOne({ date: rejected.preferredDate })).toBeNull();

    const cancelled = await createPending(nextDate());
    expect((await adminAction(cancelled.id, "approve", { date: cancelled.preferredDate, time: "10:00" })).status).toBe(200);
    expect(await ReservationDay.countDocuments({ date: cancelled.preferredDate, "reservations.0": { $exists: true } })).toBe(1);
    expect((await adminAction(cancelled.id, "cancel")).status).toBe(200);
    expect(await ReservationDay.countDocuments({ date: cancelled.preferredDate, "reservations.0": { $exists: true } })).toBe(0);

    const moved = await createPending(nextDate());
    const newDate = nextDate();
    reservationDates.push(newDate);
    expect((await adminAction(moved.id, "approve", { date: moved.preferredDate, time: "10:00" })).status).toBe(200);
    expect((await adminAction(moved.id, "reschedule", { date: newDate, time: "12:00" })).status).toBe(200);
    expect(await ReservationDay.countDocuments({ date: moved.preferredDate, "reservations.0": { $exists: true } })).toBe(0);
    expect(await ReservationDay.countDocuments({ date: newDate, "reservations.0": { $exists: true } })).toBe(1);

    const completed = await createPending(nextDate());
    expect((await adminAction(completed.id, "approve", { date: completed.preferredDate, time: "10:00" })).status).toBe(200);
    expect((await adminAction(completed.id, "complete")).status).toBe(200);
    expect((await Booking.findById(completed.id))?.status).toBe("COMPLETED");
    expect(await ReservationDay.countDocuments({ date: completed.preferredDate, "reservations.0": { $exists: true } })).toBe(0);
    expect(await reserveInterval(completed.preferredDate, new mongoose.Types.ObjectId(), 600, 660)).toBe(true);
  });

  it("archives and reactivates a service while public listings only return active services", async () => {
    const body = { id: service.id, name: service.name, description: service.description, fullDescription: "", category: "Nail services", priceLabel: "", minimumPrice: "", maximumPrice: "", durationMinutes: "60", displayOrder: "0", active: false };
    const archivedResponse = await updateService(new Request("http://localhost/api/admin/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect(archivedResponse.status).toBe(200);
    const archived = await Service.findById(service.id).lean();
    expect(archived?.active).toBe(false);
    expect(archived?.archivedAt).toBeInstanceOf(Date);
    const hidden = await (await getPublicServices()).json();
    expect(hidden.services.some((item: { _id: string }) => item._id === service.id)).toBe(false);
    expect(hidden.services.some((item: { name: string }) => defaultServiceNames.includes(item.name))).toBe(false);
    const templates = await Service.find({ name: { $in: defaultServiceNames } }).lean();
    expect(templates).toHaveLength(defaultServiceNames.length);
    expect(templates.every((item) => item.active === false)).toBe(true);

    const restoredResponse = await updateService(new Request("http://localhost/api/admin/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, active: true }) }));
    expect(restoredResponse.status).toBe(200);
    const restored = await Service.findById(service.id).lean();
    expect(restored?.active).toBe(true);
    expect(restored?.archivedAt).toBeUndefined();
    const visible = await (await getPublicServices()).json();
    expect(visible.services.some((item: { _id: string }) => item._id === service.id)).toBe(true);
  });
});
