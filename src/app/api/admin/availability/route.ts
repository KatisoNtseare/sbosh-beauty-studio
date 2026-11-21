import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Availability from "@/models/Availability";
import { minute, validCalendarDate } from "@/lib/availability";

function cleanPeriods(input: unknown, required: boolean) {
  if (!Array.isArray(input) || (required && input.length === 0) || input.length > 6) return null;
  const periods = input.map((entry) => ({ open: String(entry?.open ?? ""), close: String(entry?.close ?? "") }));
  if (periods.some((period) => minute(period.open) < 0 || minute(period.close) <= minute(period.open))) return null;
  periods.sort((a, b) => minute(a.open) - minute(b.open));
  for (let index = 1; index < periods.length; index++) if (minute(periods[index].open) < minute(periods[index - 1].close)) return null;
  return periods;
}

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb();
    const settings = await Availability.findOne().lean();
    const legacyOpeningRules = [
      ...(settings?.legacyOpeningRules ?? []),
      ...(settings?.exceptions ?? []).filter((item: { enabled?: boolean }) => item.enabled).map((item: { date: string; periods?: { open: string; close: string }[] }) => ({ date: item.date, periods: item.periods ?? [] })),
    ];
    return Response.json({ settings, legacyOpeningRules });
  } catch { return Response.json({ error: "Could not load availability." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return Response.json({ error: "Check the schedule values." }, { status: 400 });
    if (!Array.isArray(data.weekly) || data.weekly.length !== 7 || !Array.isArray(data.blockedDates) || !Array.isArray(data.blockedPeriods ?? []) || !Array.isArray(data.breaks ?? []) || !Number.isInteger(data.slotMinutes) || data.slotMinutes < 5 || data.slotMinutes > 480 || !Number.isInteger(data.bufferMinutes) || data.bufferMinutes < 0 || data.bufferMinutes > 240) return Response.json({ error: "Check the schedule values." }, { status: 400 });
    const record = (value: unknown) => Boolean(value && typeof value === "object" && !Array.isArray(value));
    if ([...data.weekly, ...(data.blockedPeriods ?? []), ...(data.breaks ?? [])].some((item) => !record(item))) return Response.json({ error: "Check the schedule entries." }, { status: 400 });
    const weekdays = new Set<number>();
    const weekly = data.weekly.map((entry: Record<string, unknown>) => {
      const weekday = Number(entry.weekday); weekdays.add(weekday);
      const periods = cleanPeriods(entry.periods ?? (entry.open && entry.close ? [{ open: entry.open, close: entry.close }] : []), Boolean(entry.enabled));
      return { weekday, enabled: Boolean(entry.enabled), periods };
    });
    if (weekdays.size !== 7 || weekly.some((day: { weekday: number; enabled: boolean; periods: unknown }) => !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 || !day.periods || (day.enabled && !(day.periods as unknown[]).length))) return Response.json({ error: "Set valid, non-overlapping periods for each weekday." }, { status: 400 });
    let blockedDates: string[] = [...new Set<string>(data.blockedDates.map(String))];
    if (blockedDates.some((date) => !validCalendarDate(date))) return Response.json({ error: "Closed dates must use a real YYYY-MM-DD date." }, { status: 400 });
    const breaks = (data.breaks ?? []).map((item: Record<string, unknown>) => ({ start: String(item.start ?? ""), end: String(item.end ?? "") }));
    if (breaks.length > 10 || breaks.some((item: { start: string; end: string }) => minute(item.start) < 0 || minute(item.end) <= minute(item.start))) return Response.json({ error: "Break periods must have valid start and end times." }, { status: 400 });
    const blockedPeriods = (data.blockedPeriods ?? []).map((item: Record<string, unknown>) => ({ date: String(item.date ?? ""), start: String(item.start ?? ""), end: String(item.end ?? "") }));
    if (blockedPeriods.length > 100 || blockedPeriods.some((item: { date: string; start: string; end: string }) => !validCalendarDate(item.date) || minute(item.start) < 0 || minute(item.end) <= minute(item.start))) return Response.json({ error: "Blocked periods must include a valid date and time range." }, { status: 400 });
    await connectDb();
    const current = await Availability.findOne();
    const existingClosed = current?.exceptions?.filter((item: { enabled?: boolean }) => item.enabled === false).map((item: { date: string }) => item.date) ?? [];
    blockedDates = [...new Set([...blockedDates, ...existingClosed])];
    const legacyOpeningRules = [
      ...(current?.legacyOpeningRules ?? []),
      ...(current?.exceptions ?? []).filter((item: { enabled?: boolean }) => item.enabled).map((item: { date: string; periods?: { open: string; close: string }[] }) => ({ date: item.date, periods: item.periods ?? [] })),
    ];
    const settings = await Availability.findOneAndUpdate(
      {},
      { $set: { weekly, blockedDates, blockedPeriods, breaks, legacyOpeningRules, exceptions: [], slotMinutes: data.slotMinutes, bufferMinutes: data.bufferMinutes, timeZone: "Africa/Johannesburg" }, $unset: { breakStart: 1, breakEnd: 1 } },
      { upsert: true, new: true, runValidators: true },
    );
    return Response.json({ settings });
  } catch { return Response.json({ error: "Availability could not be saved." }, { status: 503 }); }
}
