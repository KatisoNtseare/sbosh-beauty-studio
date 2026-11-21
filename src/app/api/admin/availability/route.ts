import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Availability from "@/models/Availability";

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { await connectDb(); return Response.json({ settings: await Availability.findOne().lean() }); }
  catch { return Response.json({ error: "Could not load availability." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await request.json();
    if (!Array.isArray(data.weekly) || data.weekly.length !== 7 || !Array.isArray(data.exceptions) || !Array.isArray(data.blockedDates) || !Number.isInteger(data.slotMinutes) || data.slotMinutes < 5 || data.slotMinutes > 480 || !Number.isInteger(data.bufferMinutes) || data.bufferMinutes < 0 || data.bufferMinutes > 240) return Response.json({ error: "Check the schedule values." }, { status: 400 });
    for (const entry of data.weekly) if (entry.enabled && (!/^\d{2}:\d{2}$/.test(entry.open) || !/^\d{2}:\d{2}$/.test(entry.close) || entry.open >= entry.close)) return Response.json({ error: "Opening hours must be valid and closing must follow opening." }, { status: 400 });
    await connectDb(); const settings = await Availability.findOneAndUpdate({}, { $set: { weekly: data.weekly, exceptions: data.exceptions, blockedDates: data.blockedDates, slotMinutes: data.slotMinutes, bufferMinutes: data.bufferMinutes, breakStart: data.breakStart || undefined, breakEnd: data.breakEnd || undefined, timeZone: "Africa/Johannesburg" } }, { upsert: true, new: true, runValidators: true });
    return Response.json({ settings });
  } catch { return Response.json({ error: "Availability could not be saved." }, { status: 503 }); }
}
