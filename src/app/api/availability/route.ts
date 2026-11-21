import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate } from "@/lib/availability";
import Service from "@/models/Service";
import mongoose from "mongoose";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";
  if (!validDate(date) || !mongoose.isValidObjectId(serviceId)) return Response.json({ error: "Choose a service and a valid date." }, { status: 400 });
  try {
    await connectDb();
    const service = await Service.findOne({ _id: serviceId, active: true }).select("durationMinutes").lean();
    if (!service?.durationMinutes) return Response.json({ date, times: [], error: "The studio has not configured this service duration yet." });
    return Response.json({ date, times: await slotsFor(date, service.durationMinutes) });
  }
  catch { return Response.json({ error: "Availability is not configured yet." }, { status: 503 }); }
}
