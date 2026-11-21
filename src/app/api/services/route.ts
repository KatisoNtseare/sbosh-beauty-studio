import { connectDb } from "@/lib/mongodb";
import Service from "@/models/Service";

const initial = ["Manicure", "Gel Nails", "Overlay", "Nail Repair", "Buff & Shine"];
export async function GET() {
  try {
    await connectDb();
    await Promise.all(initial.map((name) => Service.updateOne({ name }, { $setOnInsert: { name, image: "/images/hero.jpg", active: true } }, { upsert: true })));
    return Response.json({ services: await Service.find({ active: true }).select("name description image priceLabel durationMinutes").sort({ name: 1 }).lean() });
  } catch { return Response.json({ error: "Services are temporarily unavailable." }, { status: 503 }); }
}
