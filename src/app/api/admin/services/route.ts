import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Service from "@/models/Service";

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { await connectDb(); return Response.json({ services: await Service.find().sort({ name: 1 }).lean() }); }
  catch { return Response.json({ error: "Could not load services." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json(); if (!mongoose.isValidObjectId(body.id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    const description = String(body.description ?? "").trim(); const priceLabel = String(body.priceLabel ?? "").trim(); const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : undefined;
    if (description.length > 500 || priceLabel.length > 100 || (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600))) return Response.json({ error: "Check service details." }, { status: 400 });
    await connectDb(); const service = await Service.findByIdAndUpdate(body.id, { description, priceLabel, durationMinutes }, { new: true, runValidators: true });
    return service ? Response.json({ service }) : Response.json({ error: "Service not found." }, { status: 404 });
  } catch { return Response.json({ error: "Service could not be saved." }, { status: 503 }); }
}
