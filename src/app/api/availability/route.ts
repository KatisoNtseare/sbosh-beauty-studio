import { connectDb } from "@/lib/mongodb";
import { slotsFor, validDate } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const duration = Math.min(480, Math.max(5, Number(searchParams.get("duration") || 30)));
  if (!validDate(date)) return Response.json({ error: "Choose a valid date." }, { status: 400 });
  try { await connectDb(); return Response.json({ date, times: await slotsFor(date, duration) }); }
  catch { return Response.json({ error: "Availability is not configured yet." }, { status: 503 }); }
}
