import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import { slotsFor, validDate, minute } from "@/lib/availability";
import Booking from "@/models/Booking";
import ReservationDay from "@/models/ReservationDay";
import Availability from "@/models/Availability";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb(); const { id } = await params; if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid booking." }, { status: 400 });
    const body = await request.json(); const booking = await Booking.findById(id); if (!booking) return Response.json({ error: "Booking not found." }, { status: 404 });
    const admin = process.env.ADMIN_EMAIL || "admin"; const now = new Date();
    if (body.action === "mark-sent") {
      if (!["APPROVED", "REJECTED", "COMPLETED"].includes(booking.status) || !["APPROVED", "REJECTED", "COMPLETED"].includes(body.type)) return Response.json({ error: "No message is available for this status." }, { status: 409 });
      booking.whatsapp.push({ type: body.type, at: now, by: admin, status: "SENT" }); await booking.save(); return Response.json({ booking });
    }
    if (body.action === "reject") {
      if (booking.status !== "PENDING") return Response.json({ error: "Only pending requests can be rejected." }, { status: 409 });
      const reason = String(body.reason ?? "").trim().slice(0, 500);
      const rejected = await Booking.updateOne({ _id: booking._id, status: "PENDING" }, { $set: { status: "REJECTED", rejectionReason: reason, decidedBy: admin }, $push: { history: { status: "REJECTED", at: now, by: admin, note: reason } } });
      if (!rejected.modifiedCount) return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action === "complete") {
      if (booking.status !== "APPROVED") return Response.json({ error: "Only approved appointments can be completed." }, { status: 409 });
      const completed = await Booking.updateOne({ _id: booking._id, status: "APPROVED" }, { $set: { status: "COMPLETED", completedAt: now }, $push: { history: { status: "COMPLETED", at: now, by: admin } } });
      if (!completed.modifiedCount) return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      if (booking.confirmedDate) await ReservationDay.updateOne({ date: booking.confirmedDate }, { $pull: { reservations: { bookingId: booking._id } } });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action === "reschedule") {
      if (booking.status !== "APPROVED" || !booking.confirmedDate || !booking.confirmedStart) return Response.json({ error: "Only approved appointments can be rescheduled." }, { status: 409 });
      const date = String(body.date ?? ""); const startTime = String(body.time ?? "");
      const duration = Math.max(5, Number(booking.service.durationMinutes || 30)); const start = minute(startTime); const end = start + duration;
      if (!validDate(date) || start < 0 || end >= 1440 || !(await slotsFor(date, duration, String(booking._id))).includes(startTime)) return Response.json({ error: "That time is outside configured availability." }, { status: 409 });
      if (date === booking.confirmedDate && startTime === booking.confirmedStart) return Response.json({ booking: booking.toObject() });
      const settings = await Availability.findOne().lean(); const buffer = Number(settings?.bufferMinutes || 0);
      const oldDate = booking.confirmedDate; const oldStart = minute(booking.confirmedStart); const oldEnd = minute(booking.confirmedEnd || "") || oldStart + duration;
      await ReservationDay.updateOne({ date }, { $setOnInsert: { date, reservations: [] } }, { upsert: true });
      const newReservation = { bookingId: booking._id, start: Math.max(0, start - buffer), end: Math.min(1440, end + buffer) };
      const conflictFilter = date === oldDate ? { $ne: booking._id } : { $exists: true };
      const query = date === oldDate
        ? { date, reservations: { $not: { $elemMatch: { bookingId: conflictFilter, start: { $lt: end + buffer }, end: { $gt: start - buffer } } } } }
        : { date, reservations: { $not: { $elemMatch: { start: { $lt: end + buffer }, end: { $gt: start - buffer } } } } };
      const added = await ReservationDay.updateOne(query, { $push: { reservations: newReservation } });
      if (!added.modifiedCount) return Response.json({ error: "This time was just taken. Choose another." }, { status: 409 });
      const endTime = `${String(Math.floor(end / 60)).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`;
      const moved = await Booking.updateOne({ _id: booking._id, status: "APPROVED", confirmedDate: oldDate, confirmedStart: booking.confirmedStart }, { $set: { confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, decidedBy: admin }, $push: { history: { status: "RESCHEDULED", at: now, by: admin, note: `${oldDate} ${booking.confirmedStart} → ${date} ${startTime}` } } });
      if (!moved.modifiedCount) {
        await ReservationDay.updateOne({ date }, { $pull: { reservations: newReservation } });
        return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 });
      }
      await ReservationDay.updateOne({ date: oldDate }, { $pull: { reservations: { bookingId: booking._id, start: Math.max(0, oldStart - buffer), end: Math.min(1440, oldEnd + buffer) } } });
      return Response.json({ booking: await Booking.findById(id).lean() });
    }
    if (body.action !== "approve") return Response.json({ error: "Unsupported action." }, { status: 400 });
    if (booking.status !== "PENDING") return Response.json({ error: "Only pending requests can be approved." }, { status: 409 });
    const date = String(body.date ?? booking.preferredDate); const startTime = String(body.time ?? booking.preferredTime);
    const duration = Math.max(5, Number(booking.service.durationMinutes || 30)); const start = minute(startTime); const end = start + duration;
    const endTime = `${String(Math.floor(end / 60)).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`;
    if (!validDate(date) || start < 0 || end >= 1440 || !(await slotsFor(date, duration)).includes(startTime)) return Response.json({ error: "That time is outside configured availability." }, { status: 409 });
    const settings = await Availability.findOne().lean(); const buffer = Number(settings?.bufferMinutes || 0);
    await ReservationDay.updateOne({ date }, { $setOnInsert: { date, reservations: [] } }, { upsert: true });
    const reservation = await ReservationDay.updateOne({ date, reservations: { $not: { $elemMatch: { start: { $lt: end + buffer }, end: { $gt: start - buffer } } } } }, { $push: { reservations: { bookingId: booking._id, start: Math.max(0, start - buffer), end: Math.min(1440, end + buffer) } } });
    if (!reservation.modifiedCount) return Response.json({ error: "This time was just taken. Choose another." }, { status: 409 });
    const saved = await Booking.updateOne({ _id: booking._id, status: "PENDING" }, { $set: { status: "APPROVED", confirmedDate: date, confirmedStart: startTime, confirmedEnd: endTime, approvedAt: now, decidedBy: admin }, $push: { history: { status: "APPROVED", at: now, by: admin } } });
    if (!saved.modifiedCount) { await ReservationDay.updateOne({ date }, { $pull: { reservations: { bookingId: booking._id, start: Math.max(0, start - buffer), end: Math.min(1440, end + buffer) } } }); return Response.json({ error: "Booking changed; refresh and try again." }, { status: 409 }); }
    return Response.json({ booking: await Booking.findById(id).lean() });
  } catch { return Response.json({ error: "Booking could not be updated." }, { status: 503 }); }
}
