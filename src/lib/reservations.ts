import ReservationDay from "@/models/ReservationDay";
import type { ClientSession } from "mongoose";

function duplicateKey(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function ensureReservationDay(date: string) {
  try { await ReservationDay.updateOne({ date }, { $setOnInsert: { date, reservations: [] } }, { upsert: true }); }
  catch (error) { if (!duplicateKey(error)) throw error; }
}

/** Atomically reserves a buffered interval in the unique salon-local day document. */
export async function reserveInterval(date: string, bookingId: unknown, start: number, end: number, buffer = 0, ignoreBookingId?: unknown, session?: ClientSession) {
  const paddedStart = Math.max(0, start - buffer);
  const paddedEnd = Math.min(1440, end + buffer);
  if (!session) await ensureReservationDay(date);
  const conflict = { start: { $lt: paddedEnd }, end: { $gt: paddedStart }, ...(ignoreBookingId ? { bookingId: { $ne: ignoreBookingId } } : {}) };
  const filter: Record<string, unknown> = { date, reservations: { $not: { $elemMatch: conflict } } };
  if (ignoreBookingId) filter.$and = [{ reservations: { $not: { $elemMatch: { bookingId: ignoreBookingId, rawStart: start, rawEnd: end } } } }];
  const result = await ReservationDay.updateOne(
    filter,
    { $push: { reservations: { bookingId, start: paddedStart, end: paddedEnd, rawStart: start, rawEnd: end, reservedAt: new Date() } } },
    session ? { session } : {},
  );
  return result.modifiedCount > 0;
}

export async function releaseInterval(date: string, bookingId: unknown, start?: number, end?: number, session?: ClientSession) {
  const interval: Record<string, unknown> = { bookingId };
  if (start !== undefined && end !== undefined) {
    interval.rawStart = start;
    interval.rawEnd = end;
  }
  await ReservationDay.updateOne({ date }, { $pull: { reservations: interval } }, session ? { session } : {});
}

export function transactionUnsupported(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? Number(error.code) : 0;
  const message = "message" in error ? String(error.message) : "";
  return code === 20 || /transactions are only allowed on a replica set member or mongos/i.test(message);
}
