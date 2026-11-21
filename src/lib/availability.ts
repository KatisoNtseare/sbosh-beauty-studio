import Availability from "@/models/Availability";
import ReservationDay from "@/models/ReservationDay";
import { todayInSalon } from "@/lib/timezone";
import { businessProfile } from "@/lib/brand";

export { todayInSalon } from "@/lib/timezone";
export function minute(value: string) { const [h, m] = value.split(":").map(Number); return Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h < 24 && m >= 0 && m < 60 ? h * 60 + m : -1; }
/** Use a confirmed service length when one exists. Otherwise reserve one configured availability slot. */
export const DEFAULT_RESERVATION_BLOCK_MINUTES = 30;
export const MAX_BOOKING_RESERVATION_MINUTES = 120;
export const MAX_BOOKING_DURATION_MESSAGE = "A booking cannot exceed 2 hours. Please split your selection into separate bookings.";
export function calculateBookingReservation(componentCounts: number[]) {
  if (!Array.isArray(componentCounts) || !componentCounts.length || componentCounts.some((count) => !Number.isInteger(count) || count < 1 || count > 8)) return null;
  const minutes = componentCounts.reduce((total, count) => total + count * DEFAULT_RESERVATION_BLOCK_MINUTES, 0);
  return { minutes, exceedsMaximum: minutes > MAX_BOOKING_RESERVATION_MINUTES };
}
export function validCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function validDate(value: string) { return validCalendarDate(value) && value >= todayInSalon(); }

export async function slotsFor(date: string, duration: number, ignoreBookingId?: string) {
  if (!Number.isInteger(duration) || duration < 1 || duration > MAX_BOOKING_RESERVATION_MINUTES) return [];
  const settings = await Availability.findOne().lean();
  if (!settings || !validDate(date) || settings.blockedDates?.includes(date)) return [];
  const legacyClosed = settings.exceptions?.some((item: { date: string; enabled?: boolean }) => item.date === date && item.enabled === false);
  if (legacyClosed) return [];
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const weekly = settings.weekly?.find((item: { weekday: number }) => item.weekday === weekday);
  const hours = weekly?.enabled ? weekly : null;
  if (!hours) return [];
  const periods: { open: string; close: string }[] = Array.isArray(hours.periods) && hours.periods.length
    ? hours.periods : hours.open && hours.close ? [{ open: hours.open, close: hours.close }] : [];
  if (!periods.length) return [];
  const step = Math.max(5, Number(settings.slotMinutes || 30));
  const reservations = await ReservationDay.findOne({ date }).lean();
  const occupied = (reservations?.reservations ?? []).filter((r: { bookingId: unknown }) => String(r.bookingId) !== ignoreBookingId);
  const [currentHour, currentMinute] = new Intl.DateTimeFormat("en-GB", { timeZone: businessProfile.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).split(":").map(Number);
  const currentTime = currentHour * 60 + currentMinute;
  const breaks = Array.isArray(settings.breaks) ? [...settings.breaks] : [];
  if (settings.breakStart && settings.breakEnd) breaks.push({ start: settings.breakStart, end: settings.breakEnd });
  const blocked = (settings.blockedPeriods ?? []).filter((period: { date: string }) => period.date === date);
  const out = new Set<string>();
  for (const period of periods) {
    const open = minute(period.open), close = minute(period.close);
    if (open < 0 || close <= open) continue;
    for (let start = open; start + duration <= close; start += step) {
      const end = start + duration;
      if (date === todayInSalon() && start <= currentTime) continue;
      const inBreak = breaks.some((item: { start: string; end: string }) => {
        const breakStart = minute(item.start), breakEnd = minute(item.end);
        return breakStart >= 0 && breakEnd > breakStart && start < breakEnd && end > breakStart;
      });
      const inBlockedPeriod = blocked.some((item: { start: string; end: string }) => {
        const blockedStart = minute(item.start), blockedEnd = minute(item.end);
        return blockedStart >= 0 && blockedEnd > blockedStart && start < blockedEnd && end > blockedStart;
      });
      if (inBreak || inBlockedPeriod || occupied.some((r: { start: number; end: number }) => start < r.end && end > r.start)) continue;
      out.add(String(Math.floor(start / 60)).padStart(2,"0") + ":" + String(start % 60).padStart(2,"0"));
    }
  }
  return [...out].sort();
}
