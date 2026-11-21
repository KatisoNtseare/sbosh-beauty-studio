import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Booking from "@/models/Booking";

export async function GET(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb(); const { searchParams } = new URL(request.url); const status = searchParams.get("status"); const query: Record<string, unknown> = {};
    if (status && ["PENDING", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) query.status = status;
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(500).lean();
    const counts = await Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const upcoming = await Booking.countDocuments({ status: "APPROVED", confirmedDate: { $gte: today } });
    return Response.json({ bookings, counts: { ...Object.fromEntries(counts.map((row) => [row._id, row.count])), UPCOMING: upcoming } });
  } catch { return Response.json({ error: "Bookings are temporarily unavailable." }, { status: 503 }); }
}
