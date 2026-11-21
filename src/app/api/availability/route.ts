import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate } from "@/lib/availability";
import Availability from "@/models/Availability";
import Service from "@/models/Service";
import { resolveAppointmentDuration, classifyService } from "@/lib/domain";
import mongoose from "mongoose";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";
  if (!validDate(date) || !mongoose.isValidObjectId(serviceId)) return Response.json({ error: "Choose a service and a valid date." }, { status: 400 });
  try {
    await connectDb();
    const service = await Service.findOne({ _id: serviceId, active: true }).select("classification category name").lean();
    if (!service) return Response.json({ date, times: [], error: "That service is no longer available." }, { status: 404 });
    const settings = await Availability.findOne().lean();
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const weekly = settings?.weekly?.find((item: { weekday: number }) => item.weekday === weekday);
    const closed = Boolean(settings?.blockedDates?.includes(date) || settings?.exceptions?.some((item: { date: string; enabled?: boolean }) => item.date === date && item.enabled === false));
    if (closed) return Response.json({ date, times: [], error: "The studio is closed on this date.", closed: true });
    if (!weekly?.enabled) return Response.json({ date, times: [], error: "There are no available appointments on this date. Please choose another date." });
    const duration = resolveAppointmentDuration(service.classification || classifyService(service.category, service.name));
    const times = await slotsFor(date, duration);
    return Response.json({ date, times, error: times.length ? undefined : "There are no available appointments on this date. Please choose another date." });
  } catch { return Response.json({ error: "Availability is not configured yet." }, { status: 503 }); }
}
