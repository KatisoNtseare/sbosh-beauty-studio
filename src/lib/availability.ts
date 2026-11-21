import Availability from "@/models/Availability";
import ReservationDay from "@/models/ReservationDay";

export function todayInSalon() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function minute(value: string) { const [h, m] = value.split(":").map(Number); return Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h < 24 && m >= 0 && m < 60 ? h * 60 + m : -1; }
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00+02:00`).toISOString().slice(0, 10) === value && value >= todayInSalon(); }

export async function slotsFor(date: string, duration = 30, ignoreBookingId?: string) {
  const settings = await Availability.findOne().lean();
  if (!settings || !validDate(date) || settings.blockedDates?.includes(date)) return [];
  const exceptions = settings.exceptions?.find((item: { date: string }) => item.date === date);
  const weekday = new Date(`${date}T12:00:00+02:00`).getDay();
  const weekly = settings.weekly?.find((item: { weekday: number }) => item.weekday === weekday);
  const hours = exceptions ? (exceptions.enabled ? exceptions : null) : (weekly?.enabled ? weekly : null);
  if (!hours?.open || !hours.close) return [];
  const open = minute(hours.open), close = minute(hours.close);
  if (open < 0 || close <= open) return [];
  const step = Math.max(5, Number(settings.slotMinutes || 30));
  const reservations = await ReservationDay.findOne({ date }).lean();
  const occupied = (reservations?.reservations ?? []).filter((r: { bookingId: unknown }) => String(r.bookingId) !== ignoreBookingId);
  const [currentHour, currentMinute] = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).split(":").map(Number);
  const currentTime = currentHour * 60 + currentMinute;
  const out: string[] = [];
  for (let start = open; start + duration <= close; start += step) {
    const end = start + duration;
    if (date === todayInSalon() && start <= currentTime) continue;
    const breakStart = settings.breakStart ? minute(settings.breakStart) : -1;
    const breakEnd = settings.breakEnd ? minute(settings.breakEnd) : -1;
    if (breakStart >= 0 && breakEnd > breakStart && start < breakEnd && end > breakStart) continue;
    if (occupied.some((r: { start: number; end: number }) => start < r.end && end > r.start)) continue;
    out.push(`${String(Math.floor(start / 60)).padStart(2,"0")}:${String(start % 60).padStart(2,"0")}`);
  }
  return out;
}
