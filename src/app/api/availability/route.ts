import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate } from "@/lib/availability";
import Availability from "@/models/Availability";
import { loadCatalogueQuote } from "@/lib/catalogue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";
  const packageId = searchParams.get("packageId") ?? "";
  let items: unknown[] | undefined;
  let extras: { key: string; quantity: number }[] = [];
  try { extras = searchParams.has("extras") ? JSON.parse(searchParams.get("extras")!) : []; }
  catch { return Response.json({ error: "Extra selection is invalid." }, { status: 400 }); }
  try { items = searchParams.has("items") ? JSON.parse(searchParams.get("items")!) : undefined; }
  catch { return Response.json({ error: "Cart selection is invalid." }, { status: 400 }); }
  if (!validDate(date) || !Array.isArray(extras) || extras.length > 20) return Response.json({ error: "Choose a service or package and a valid date." }, { status: 400 });
  try {
    await connectDb();
    let quote;
    try { quote = await loadCatalogueQuote(items ? { items } : { serviceId, packageId, extras }); }
    catch (error) { return Response.json({ date, times: [], error: error instanceof Error ? error.message : "Choose an available service." }, { status: 404 }); }
    if (!quote.durationMinutes) return Response.json({ date, times: [], error: "Appointment length must be configured before times can be offered." }, { status: 409 });
    const settings = await Availability.findOne().lean();
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const weekly = settings?.weekly?.find((item: { weekday: number }) => item.weekday === weekday);
    const closed = Boolean(settings?.blockedDates?.includes(date) || settings?.exceptions?.some((item: { date: string; enabled?: boolean }) => item.date === date && item.enabled === false));
    if (closed) return Response.json({ date, times: [], error: "The studio is closed on this date.", closed: true });
    if (!weekly?.enabled) return Response.json({ date, times: [], error: "No available appointment times on this date. Please select another date." });
    const times = await slotsFor(date, quote.durationMinutes);
    return Response.json({ date, times, error: times.length ? undefined : "No available appointment times on this date. Please select another date." });
  } catch { return Response.json({ error: "Availability is not configured yet." }, { status: 503 }); }
}
