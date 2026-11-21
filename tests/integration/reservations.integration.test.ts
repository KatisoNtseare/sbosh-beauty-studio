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
import Admin from "@/models/Admin";
import Availability from "@/models/Availability";
import RateLimit from "@/models/RateLimit";
import ReservationDay from "@/models/ReservationDay";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import Counter from "@/models/Counter";
import { POST as submitBooking } from "@/app/api/bookings/route";
import { PATCH as updateBooking } from "@/app/api/admin/bookings/[id]/route";
import { PATCH as updateService } from "@/app/api/admin/services/route";
import { GET as getPublicServices } from "@/app/api/services/route";
import { GET as getAdminBookings } from "@/app/api/admin/bookings/route";
import { GET as getAdminAvailability } from "@/app/api/admin/availability/route";
import { GET as getAdminServices } from "@/app/api/admin/services/route";
import { GET as getAdminPackages } from "@/app/api/admin/packages/route";
import { GET as getCatalogue } from "@/app/api/services/route";
const smtpMock = (globalThis as typeof globalThis & { __integrationSmtpMock: { sendMail: ReturnType<typeof vi.fn> } }).__integrationSmtpMock;

const cleanupBookingIds: mongoose.Types.ObjectId[] = [];
const testRunId = randomUUID();
const integrationLockId = new mongoose.Types.ObjectId("000000000000000000000001");
const reservationDates: string[] = [];
const rateLimitIds = new Set<string>();
const admin = { id: new mongoose.Types.ObjectId().toString(), email: "integration@example.test", name: "Integration Admin" };
let service: mongoose.HydratedDocument<InstanceType<typeof Service>>;
let pedicure: mongoose.HydratedDocument<InstanceType<typeof Service>>;
let repair: mongoose.HydratedDocument<InstanceType<typeof Service>>;
let packageFixture: mongoose.HydratedDocument<InstanceType<typeof ServicePackage>>;
let availabilityId: mongoose.Types.ObjectId;
let safeToCleanup = false;
let testLockAcquired = false;
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

async function postBooking(body: Record<string, unknown>, key: string) {
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
    if (typeof body.date === "string") reservationDates.push(body.date);
  }
  return { response, result };
}

async function createPending(date: string, time = "10:00") {
  reservationDates.push(date);
  const booking = await Booking.create({
    reference: `IT-${testRunId}-${randomUUID()}`,
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

async function adminAction(id: string, action: string, extra: Record<string, unknown> = {}) {
  return updateBooking(new Request(`http://localhost/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  }), { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  await connectDb();
  const database = mongoose.connection.db;
  if (!database) throw new Error("The isolated test database connection is unavailable.");
  try {
    await database.collection("sbosh_integration_locks").insertOne({ _id: integrationLockId, runId: testRunId, startedAt: new Date() });
    testLockAcquired = true;
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    throw new Error("Another integration run is active or a prior run left a lock in the test database. No records were changed.");
  }
  sessionState.value = adminCookieValue(admin);
  const counts = await Promise.all([
    Admin.countDocuments(), Booking.countDocuments(), Service.countDocuments(), ServicePackage.countDocuments(), Availability.countDocuments(), Counter.countDocuments(),
    ReservationDay.countDocuments(), RateLimit.countDocuments(),
  ]);
  if (counts.some((count) => count !== 0)) {
    throw new Error("The isolated test database must be empty before integration tests run; no records were deleted.");
  }
  safeToCleanup = true;
  await Promise.all([Booking, Service, ServicePackage, Availability, ReservationDay, RateLimit, Counter].map((model) => model.createIndexes()));

  service = await Service.create({ name: `Integration service ${testRunId}`, description: "Test", price: 190, priceConfirmed: true, durationMinutes: 60, durationConfirmed: true, extras: [{ key: "nail-art", name: "Nail Art", unitPrice: 15, method: "PER_NAIL" }], active: true });
  pedicure = await Service.create({ name: `Integration pedicure ${testRunId}`, description: "Test pedicure", price: 110, priceConfirmed: true, durationMinutes: 30, durationConfirmed: true, active: true });
  repair = await Service.create({ name: `Integration repair ${testRunId}`, description: "Price to be confirmed", priceConfirmed: false, durationMinutes: 45, durationConfirmed: true, active: true });
  packageFixture = await ServicePackage.create({ name: `Integration package ${testRunId}`, description: "Test pair", serviceIds: [service._id, pedicure._id], active: true, additionalDurationMinutes: 0 });
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
      if (packageFixture?._id) await ServicePackage.deleteOne({ _id: packageFixture._id });
      if (repair?._id) await Service.deleteOne({ _id: repair._id });
      if (pedicure?._id) await Service.deleteOne({ _id: pedicure._id });
      if (service?._id) await Service.deleteOne({ _id: service._id });
      if (rateLimitIds.size) await RateLimit.deleteMany({ _id: { $in: [...rateLimitIds] } });
      await Counter.deleteOne({ _id: "booking-reference" });
    }
  } finally {
    sessionState.value = "";
    sessionState.queue = [];
    if (testLockAcquired) await mongoose.connection.db?.collection("sbosh_integration_locks").deleteOne({ _id: integrationLockId, runId: testRunId });
    await mongoose.disconnect();
  }
});

describe("MongoDB booking and reservation integration", () => {
  it("rejects unauthenticated access to administrative APIs", async () => {
    sessionState.value = "";
    try {
      const responses = await Promise.all([
        getAdminBookings(new Request("http://localhost/api/admin/bookings")),
        getAdminAvailability(),
        getAdminServices(),
        getAdminPackages(),
      ]);
      expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
    } finally {
      sessionState.value = adminCookieValue(admin);
    }
  });

  it("replays an idempotent booking before rechecking later availability and rejects key reuse with different details", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const key = `${testRunId}-retry-${randomUUID()}`;
    const body = { ...bookingBody(date), name: "<img src=x onerror=alert(1)> Client" };
    const first = await postBooking(body, key);
    expect(first.response.status).toBe(201);
    expect(first.result.reference).toMatch(/^#SBS\d+$/);
    const submitted = await Booking.findOne({ reference: first.result.reference });
    expect(submitted?.notifications[0]).toMatchObject({ type: "ADMIN_NEW_BOOKING", status: "SENT" });
    expect(smtpMock.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
      to: "admin@example.test",
      text: expect.stringContaining("Status: PENDING"),
      html: expect.stringContaining("&lt;img src=x onerror=alert(1)&gt; Client"),
    }));
    expect(smtpMock.sendMail.mock.calls.at(-1)?.[0].html).not.toContain("<img src=x");

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
    const key = `${testRunId}-parallel-${randomUUID()}`;
    const sameKey = await Promise.all(Array.from({ length: 6 }, () => postBooking(body, key)));
    expect(sameKey.filter(({ response }) => response.status === 201)).toHaveLength(1);
    expect(sameKey.every(({ response }) => [200, 201].includes(response.status))).toBe(true);
    expect(new Set(sameKey.map(({ result }) => result.reference)).size).toBe(1);
    expect(await Booking.countDocuments({ idempotencyKey: key })).toBe(1);
    const single = await Booking.findOne({ idempotencyKey: key });
    expect(single?.notifications.filter((notice: { type: string }) => notice.type === "ADMIN_NEW_BOOKING")).toHaveLength(1);

    const distinct = await Promise.all([
      postBooking(body, `${testRunId}-distinct-a-${randomUUID()}`),
      postBooking(body, `${testRunId}-distinct-b-${randomUUID()}`),
    ]);
    expect(distinct.every(({ response }) => response.status === 201)).toBe(true);
    const references = distinct.map(({ result }) => result.reference as string);
    expect(references.every((reference) => /^#SBS\d+$/.test(reference))).toBe(true);
    expect(new Set(references).size).toBe(2);
    const sequences = references.map((reference) => Number(reference.slice(4))).sort((a, b) => a - b);
    expect(sequences[1]).toBe(sequences[0] + 1);
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

  it("keeps a failed new-booking email retryable and retries without another booking or notification", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const key = `${testRunId}-email-fail-${randomUUID()}`;
    const body = bookingBody(date);
    smtpMock.sendMail.mockRejectedValueOnce(new Error("fake SMTP failure"));
    const first = await postBooking(body, key);
    expect(first.response.status).toBe(201);
    expect(first.result.emailStatus).toBe("FAILED");
    const booking = await Booking.findOne({ idempotencyKey: key });
    expect(booking?.status).toBe("PENDING");
    expect(booking?.notifications).toHaveLength(1);
    expect(booking?.notifications[0].status).toBe("FAILED");

    const retried = await adminAction(String(booking?._id), "retry-email", { notificationId: String(booking?.notifications[0]._id) });
    expect(retried.status).toBe(200);
    const updated = await Booking.findById(booking?._id);
    expect(updated?.status).toBe("PENDING");
    expect(updated?.notifications).toHaveLength(1);
    expect(updated?.notifications[0]).toMatchObject({ status: "SENT", attemptCount: 2 });
    const replay = await postBooking(body, key);
    expect(replay.response.status).toBe(200);
    expect(await Booking.countDocuments({ idempotencyKey: key })).toBe(1);
    expect(smtpMock.sendMail).toHaveBeenCalledTimes(2);
  });

  it("recovers only stale SENDING notifications through the atomic retry claim", async () => {
    const date = nextDate();
    reservationDates.push(date);
    const created = await postBooking(bookingBody(date), `${testRunId}-stale-${randomUUID()}`);
    const booking = await Booking.findOne({ reference: created.result.reference });
    if (!booking) throw new Error("Test booking was not saved.");
    const notificationId = String(booking.notifications[0]._id);
    await Booking.updateOne({ _id: booking._id }, { $set: { "notifications.0.status": "SENDING", "notifications.0.attemptedAt": new Date() } });
    expect((await adminAction(String(booking._id), "retry-email", { notificationId })).status).toBe(409);

    await Booking.updateOne({ _id: booking._id }, { $set: { "notifications.0.attemptedAt": new Date(Date.now() - 6 * 60_000) } });
    const recovered = await adminAction(String(booking._id), "retry-email", { notificationId });
    expect(recovered.status).toBe(200);
    expect((await Booking.findById(booking._id))?.notifications[0]).toMatchObject({ status: "SENT", attemptCount: 2 });
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
    const rejection = await adminAction(rejected.id, "reject", { reason: "Please choose another time." });
    expect(rejection.status).toBe(200);
    expect((await rejection.json()).emailStatus).toBe("SENT");
    expect((await Booking.findById(rejected.id))?.notifications[0]).toMatchObject({ type: "CUSTOMER_REJECTED", status: "SENT" });
    expect(await ReservationDay.findOne({ date: rejected.preferredDate })).toBeNull();

    const cancelled = await createPending(nextDate());
    const approval = await adminAction(cancelled.id, "approve", { date: cancelled.preferredDate, time: "10:00" });
    expect(approval.status).toBe(200);
    expect((await approval.json()).emailStatus).toBe("SENT");
    expect((await Booking.findById(cancelled.id))?.notifications[0]).toMatchObject({ type: "CUSTOMER_APPROVED", status: "SENT" });
    expect(smtpMock.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
      to: "customer@example.test",
      text: expect.stringContaining(`Appointment: ${new Intl.DateTimeFormat("en-ZA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(cancelled.preferredDate + "T12:00:00Z"))} at 10:00`),
    }));
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

  it("calculates service prices on the server and preserves the submitted snapshot", async () => {
    const result = await postBooking({ ...bookingBody(nextDate()), extras: [{ key: "nail-art", quantity: 2 }], totalPrice: 1 }, `${testRunId}-price-${randomUUID()}`);
    expect(result.response.status).toBe(201);
    const booking = await Booking.findOne({ reference: result.result.reference });
    expect(booking).toMatchObject({ totalPrice: 220, priceNeedsConfirmation: false });
    expect(booking?.extras).toMatchObject([{ name: "Nail Art", quantity: 2, unitPrice: 15, subtotal: 30 }]);
    await Service.updateOne({ _id: service._id }, { $set: { price: 500 } });
    expect((await Booking.findById(booking?._id))?.totalPrice).toBe(220);
    await Service.updateOne({ _id: service._id }, { $set: { price: 190 } });
  });

  it("calculates package prices from current components and snapshots package selections", async () => {
    sessionState.value = adminCookieValue(admin);
    const catalogue = await (await getCatalogue()).json();
    const item = catalogue.packages.find((entry: { _id: string }) => entry._id === packageFixture.id);
    expect(item).toMatchObject({ price: 300, priceConfirmed: true, durationMinutes: 90 });
    const result = await postBooking({ ...bookingBody(nextDate()), serviceId: undefined, packageId: packageFixture.id, extras: [{ key: `${service.id}:nail-art`, quantity: 2 }], totalPrice: 0 }, `${testRunId}-package-${randomUUID()}`);
    expect(result.response.status).toBe(201);
    const booking = await Booking.findOne({ reference: result.result.reference });
    expect(booking).toMatchObject({ totalPrice: 330, priceNeedsConfirmation: false, service: { isPackage: true, name: packageFixture.name, durationMinutes: 90 } });
    expect(booking?.service.components).toHaveLength(2);
    expect(booking?.extras[0].subtotal).toBe(30);
    await Service.updateOne({ _id: pedicure._id }, { $set: { price: 125 } });
    const updatedCatalogue = await (await getCatalogue()).json();
    expect(updatedCatalogue.packages.find((entry: { _id: string }) => entry._id === packageFixture.id).price).toBe(315);
    expect((await Booking.findById(booking?._id))?.totalPrice).toBe(330);
    await Service.updateOne({ _id: pedicure._id }, { $set: { price: 110 } });
  });

  it("flags an unconfirmed service price and requires customer confirmation before approval", async () => {
    const request = await postBooking({ ...bookingBody(nextDate()), serviceId: repair.id }, `${testRunId}-unconfirmed-${randomUUID()}`);
    expect(request.response.status).toBe(201);
    const booking = await Booking.findOne({ reference: request.result.reference });
    expect(booking).toMatchObject({ totalPrice: null, priceNeedsConfirmation: true });
    expect((await adminAction(booking!.id, "approve", { date: booking!.preferredDate, time: booking!.preferredTime })).status).toBe(409);
    const approved = await adminAction(booking!.id, "approve", { date: booking!.preferredDate, time: booking!.preferredTime, confirmedPrice: 85, priceConfirmedWithCustomer: true });
    expect(approved.status).toBe(200);
    expect(await Booking.findById(booking!._id)).toMatchObject({ totalPrice: 85, priceNeedsConfirmation: false });
  });

  it("does not create setup templates when the public catalogue is viewed", async () => {
    sessionState.value = adminCookieValue(admin);
    const [publicResponse] = await Promise.all([getCatalogue()]);
    expect(publicResponse.status).toBe(200);
    expect(await Service.countDocuments({ category: "Setup placeholder" })).toBe(0);
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
    expect(hidden.services.some((item: { _id: string }) => item._id === service.id)).toBe(false);

    const restoredResponse = await updateService(new Request("http://localhost/api/admin/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, active: true }) }));
    expect(restoredResponse.status).toBe(200);
    const restored = await Service.findById(service.id).lean();
    expect(restored?.active).toBe(true);
    expect(restored?.archivedAt).toBeUndefined();
    const visible = await (await getPublicServices()).json();
    expect(visible.services.some((item: { _id: string }) => item._id === service.id)).toBe(true);
  });
});
