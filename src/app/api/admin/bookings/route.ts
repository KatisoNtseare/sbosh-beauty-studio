import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { todayInSalon } from "@/lib/timezone";

function safeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb(); const { searchParams } = new URL(request.url); const status = searchParams.get("status"); const query: Record<string, unknown> = {};
    if (status && ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].includes(status)) query.status = status;
    const customer = (searchParams.get("customer") ?? "").trim().slice(0, 100); const service = (searchParams.get("service") ?? "").trim().slice(0, 100); const date = searchParams.get("date") ?? "";
    if (customer) query.$or = [{ "customer.name": { $regex: safeRegex(customer), $options: "i" } }, { "customer.email": { $regex: safeRegex(customer), $options: "i" } }, { "customer.phone": { $regex: safeRegex(customer), $options: "i" } }, { reference: { $regex: safeRegex(customer), $options: "i" } }];
    if (service) query["service.name"] = service;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) query.$and = [...((query.$and as unknown[]) || []), { $or: [{ preferredDate: date }, { confirmedDate: date }] }];
    const page = Number(searchParams.get("page") || 1); const limit = 50;
    if (!Number.isInteger(page) || page < 1 || page > 100_000) return Response.json({ error: "Invalid page number." }, { status: 400 });
    const [bookings, total, serviceNames] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Booking.countDocuments(query),
      Service.distinct("name"),
    ]);
    const counts = await Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const today = todayInSalon();
    const upcoming = await Booking.countDocuments({ status: "APPROVED", confirmedDate: { $gte: today } });
    return Response.json({ bookings, total, page, pages: Math.max(1, Math.ceil(total / limit)), services: serviceNames, counts: { ...Object.fromEntries(counts.map((row) => [row._id, row.count])), UPCOMING: upcoming } });
  } catch { return Response.json({ error: "Bookings are temporarily unavailable." }, { status: 503 }); }
}
