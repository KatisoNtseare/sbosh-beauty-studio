import { connectDb } from "@/lib/mongodb";
import Service from "@/models/Service";

// Setup-only templates. They are inactive and must be reviewed/configured in /admin before publication.
const initial = ["Manicure", "Gel Nails", "Overlay", "Nail Repair", "Buff & Shine"];
export async function GET() {
  try {
    await connectDb();
    await Promise.all(initial.map(async (name) => {
      try { await Service.updateOne({ name }, { $setOnInsert: { name, image: "/images/hero.jpg", active: false, category: "Setup placeholder" } }, { upsert: true }); }
      catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error; }
    }));
    return Response.json({ services: await Service.find({ active: true }).select("name description fullDescription image priceLabel minimumPrice maximumPrice classification category displayOrder").sort({ displayOrder: 1, name: 1 }).lean() });
  } catch { return Response.json({ error: "Services are temporarily unavailable." }, { status: 503 }); }
}
