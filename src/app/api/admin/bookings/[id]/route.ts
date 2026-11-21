import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import { calculateBookingReservation, slotsFor, validDate, minute } from "@/lib/availability";
import Booking from "@/models/Booking";
import Availability from "@/models/Availability";
import { adminIdentity } from "@/lib/admin-auth";
import { canTransitionBooking } from "@/lib/domain";
import { ensureReservationDay, releaseInterval, reserveInterval, transactionUnsupported } from "@/lib/reservations";
import { sendBookingEmail } from "@/lib/booking-email";

type Ctx = { params: Promise<{ id: string }> };
class StateConflict extends Error {}
type TransactionResult = "COMMITTED" | "CONFLICT" | "UNSUPPORTED";

async function runTransaction(work: (session: mongoose.ClientSession) => Promise<void>): Promise<TransactionResult> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => work(session));
    return "COMMITTED";
  } catch (error) {
    if (error instanceof StateConflict) return "CONFLICT";
    if (transactionUnsupported(error)) return "UNSUPPORTED";
    throw error;
  } finally { await session.endSession(); }
}

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb(); const { id } = await params; if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid booking." }, { status: 400 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Invalid booking action." }, { status: 400 });
    const booking = await Booking.findById(id); if (!booking) return Response.json({ error: "Booking not found." }, { status: 404 });
    const admin = await adminIdentity();
    if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const now = new Date();
    if (body.action === "retry-email") {
      if (typeof body.notificationId !== "string" || !mongoose.isValidObjectId(body.notificationId)) return Response.json({ error: "Invalid notification." }, { status: 400 });
      const notification = booking.notifications.find((item: { _id: mongoose.Types.ObjectId; status: string; type: string }) => String(item._id) === body.notificationId);
      if (!notification || !["FAILED", "PENDING"].includes(notification.status)) return Response.json({ error: "Only failed email notifications can be retried." }, { status: 409 });
      const result = await sendBookingEmail(booking._id, notification.type as Parameters<typeof sendBookingEmail>[1], true);
      return Response.json({ booking: await Booking.findById(id).lean(), ...(result.warning ? { warning: result.warning } : {}) });
    }
    if (body.action === "reject") {
      if (!canTransitionBooking(booking.status, "reject")) return Response.json({ error: "Only pending requests can be rejected." }, { status: 409 });
      const reason = String(body.reason ?? "").trim().slice(0, 500);
      const rejected = await Booking.updateOne({ _id: booking._id, status: "PENDING" }, { $set: { status: "REJECTED", rejectionReason: reason, decidedBy: admin.id }, $push: { history: { status: "REJECTED", at: now, by: admin.name, note: reason } } });
      if (!rejected.modifiedCount) return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      await releaseInterval(booking.preferredDate, booking._id);
      const email = await sendBookingEmail(booking._id, "CUSTOMER_REJECTED");
      return Response.json({ booking: await Booking.findById(id).lean(), ...(email.warning ? { warning: email.warning } : {}) });
    }
    if (body.action === "complete") {
      if (!canTransitionBooking(booking.status, "complete")) return Response.json({ error: "Only approved appointments can be completed." }, { status: 409 });
      const result = await runTransaction(async (session) => {
        const completed = await Booking.updateOne({ _id: booking._id, status: "APPROVED" }, { $set: { status: "COMPLETED", completedAt: now }, $push: { history: { status: "COMPLETED", at: now, by: admin.name } } }, { session });
        if (!completed.modifiedCount) throw new StateConflict();
        if (booking.confirmedDate) await releaseInterval(booking.confirmedDate, booking._id, undefined, undefined, session);
      });
      if (result === "UNSUPPORTED") {
        const completed = await Booking.updateOne({ _id: booking._id, status: "APPROVED" }, { $set: { status: "COMPLETED", completedAt: now }, $push: { history: { status: "COMPLETED", at: now, by: admin.name } } });
        if (!completed.modifiedCount) return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
        if (booking.confirmedDate) await releaseInterval(booking.confirmedDate, booking._id);
      } else if (result === "CONFLICT") return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action === "cancel") {
      if (!canTransitionBooking(booking.status, "cancel")) return Response.json({ error: "Only pending or approved bookings can be cancelled." }, { status: 409 });
      const previousStatus = booking.status;
      let result: TransactionResult = "UNSUPPORTED";
      if (previousStatus === "APPROVED") result = await runTransaction(async (session) => {
        const cancelled = await Booking.updateOne({ _id: booking._id, status: previousStatus }, { $set: { status: "CANCELLED", cancelledAt: now, decidedBy: admin.id }, $push: { history: { status: "CANCELLED", at: now, by: admin.name } } }, { session });
        if (!cancelled.modifiedCount) throw new StateConflict();
        if (booking.confirmedDate) await releaseInterval(booking.confirmedDate, booking._id, undefined, undefined, session);
      });
      if (previousStatus === "PENDING" || result === "UNSUPPORTED") {
        const cancelled = await Booking.updateOne({ _id: booking._id, status: previousStatus }, { $set: { status: "CANCELLED", cancelledAt: now, decidedBy: admin.id }, $push: { history: { status: "CANCELLED", at: now, by: admin.name } } });
        if (!cancelled.modifiedCount) return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
        if (previousStatus === "APPROVED" && booking.confirmedDate) await releaseInterval(booking.confirmedDate, booking._id);
        if (previousStatus === "PENDING") await releaseInterval(booking.preferredDate, booking._id);
      } else if (result === "CONFLICT") return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action === "reschedule") {
      if (!canTransitionBooking(booking.status, "reschedule") || !booking.confirmedDate || !booking.confirmedStart) return Response.json({ error: "Only approved appointments can be rescheduled." }, { status: 409 });
      const date = String(body.date ?? ""); const startTime = String(body.time ?? "");
      const settings = await Availability.findOne().select("slotMinutes bufferMinutes").lean();
      const reservation = calculateBookingReservation();
      if (!reservation) return Response.json({ error: "Booking services could not be verified." }, { status: 409 });
      if (reservation.exceedsMaximum) return Response.json({ error: "This booking exceeds the two-hour limit and cannot be rescheduled." }, { status: 409 });
      const duration = reservation.minutes;
      const start = minute(startTime); const end = start + duration;

      if (!validDate(date) || start < 0 || end >= 1440 || !(await slotsFor(date, duration, String(booking._id))).includes(startTime)) return Response.json({ error: "That time is outside configured availability." }, { status: 409 });
      if (date === booking.confirmedDate && startTime === booking.confirmedStart) return Response.json({ booking: booking.toObject() });
      const buffer = Number(settings?.bufferMinutes || 0);
      const oldDate = booking.confirmedDate; const oldStart = minute(booking.confirmedStart); const oldEnd = minute(booking.confirmedEnd || "") || oldStart + duration;
      const endTime = `${String(Math.floor(end / 60)).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`;
      await ensureReservationDay(date);
      const result = await runTransaction(async (session) => {
        if (!(await reserveInterval(date, booking._id, start, end, buffer, date === oldDate ? booking._id : undefined, session))) throw new StateConflict();
        const moved = await Booking.updateOne({ _id: booking._id, status: "APPROVED", confirmedDate: oldDate, confirmedStart: booking.confirmedStart }, { $set: { confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, decidedBy: admin.id }, $push: { history: { status: "RESCHEDULED", at: now, by: admin.name, note: `${oldDate} ${booking.confirmedStart} → ${date} ${startTime}` } } }, { session });
        if (!moved.modifiedCount) throw new StateConflict();
        await releaseInterval(oldDate, booking._id, oldStart, oldEnd, session);
      });
      if (result === "UNSUPPORTED") {
        if (!(await reserveInterval(date, booking._id, start, end, buffer, date === oldDate ? booking._id : undefined))) return Response.json({ error: "This time was just taken. Choose another." }, { status: 409 });
        const moved = await Booking.updateOne({ _id: booking._id, status: "APPROVED", confirmedDate: oldDate, confirmedStart: booking.confirmedStart }, { $set: { confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, decidedBy: admin.id }, $push: { history: { status: "RESCHEDULED", at: now, by: admin.name, note: `${oldDate} ${booking.confirmedStart} → ${date} ${startTime}` } } });
        if (!moved.modifiedCount) { await releaseInterval(date, booking._id, start, end); return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 }); }
        await releaseInterval(oldDate, booking._id, oldStart, oldEnd);
      } else if (result === "CONFLICT") return Response.json({ error: "This time was just taken or the booking changed. Refresh and try again." }, { status: 409 });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action !== "approve") return Response.json({ error: "Unsupported action." }, { status: 400 });
    if (!canTransitionBooking(booking.status, "approve")) return Response.json({ error: "Only pending requests can be approved." }, { status: 409 });
    const date = String(body.date ?? booking.preferredDate); const startTime = String(body.time ?? booking.preferredTime);
    const settings = await Availability.findOne().select("slotMinutes bufferMinutes").lean();
    const reservation = calculateBookingReservation();
    if (!reservation) return Response.json({ error: "Booking services could not be verified." }, { status: 409 });
    if (reservation.exceedsMaximum) return Response.json({ error: "This booking exceeds the two-hour limit and cannot be approved." }, { status: 409 });
    const duration = reservation.minutes;
    const start = minute(startTime); const end = start + duration;
    let priceUpdate: Record<string, unknown> = {};
    let priceHistoryNote = "";
    if (booking.priceNeedsConfirmation) {
      const confirmedPrice = Number(body.confirmedPrice);
      if (body.priceConfirmedWithCustomer !== true || !Number.isSafeInteger(confirmedPrice) || confirmedPrice < 1) return Response.json({ error: "Confirm the agreed price with the customer and enter the amount before approving this request." }, { status: 409 });
      priceUpdate = { totalPrice: confirmedPrice, priceNeedsConfirmation: false, priceConfirmedAt: now, priceConfirmedBy: admin.id };
      priceHistoryNote = ` · Price confirmed with customer: R${confirmedPrice}`;
    }

    const endTime = `${String(Math.floor(end / 60)).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`;
    if (!validDate(date) || start < 0 || end >= 1440 || !(await slotsFor(date, duration, String(booking._id))).includes(startTime)) return Response.json({ error: "That time is outside configured availability." }, { status: 409 });
    const buffer = Number(settings?.bufferMinutes || 0);
    await ensureReservationDay(date);
    const result = await runTransaction(async (session) => {
      if (!(await reserveInterval(date, booking._id, start, end, buffer, booking._id, session))) throw new StateConflict();
      const saved = await Booking.updateOne({ _id: booking._id, status: "PENDING" }, { $set: { status: "APPROVED", confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, approvedAt: now, decidedBy: admin.id, ...priceUpdate }, $push: { history: { status: "APPROVED", at: now, by: admin.name, note: priceHistoryNote } } }, { session });
      if (!saved.modifiedCount) throw new StateConflict();
      const requestedStart = minute(booking.preferredTime);
      if (date !== booking.preferredDate || start !== requestedStart) await releaseInterval(booking.preferredDate, booking._id, requestedStart, requestedStart + duration, session);
    });
    if (result === "CONFLICT") return Response.json({ error: "This time was just taken or the booking changed. Refresh and try again." }, { status: 409 });
    if (result === "UNSUPPORTED") {
      if (!(await reserveInterval(date, booking._id, start, end, buffer, booking._id))) return Response.json({ error: "This time was just taken. Choose another." }, { status: 409 });
      const saved = await Booking.updateOne({ _id: booking._id, status: "PENDING" }, { $set: { status: "APPROVED", confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, approvedAt: now, decidedBy: admin.id, ...priceUpdate }, $push: { history: { status: "APPROVED", at: now, by: admin.name, note: priceHistoryNote } } });
      if (!saved.modifiedCount) { await releaseInterval(date, booking._id, start, end); return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 }); }
      const requestedStart = minute(booking.preferredTime);
      if (date !== booking.preferredDate || start !== requestedStart) await releaseInterval(booking.preferredDate, booking._id, requestedStart, requestedStart + duration);
    }
    const email = await sendBookingEmail(booking._id, "CUSTOMER_APPROVED");
    return Response.json({ booking: await Booking.findById(id).lean(), ...(email.warning ? { warning: email.warning } : {}) });
  } catch { return Response.json({ error: "Booking could not be updated." }, { status: 503 }); }
}
