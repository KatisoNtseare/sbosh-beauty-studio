import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { classifyService, serviceRemovalAction, validateServiceFields } from "@/lib/domain";

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb();
    const services = await Service.find().sort({ name: 1 }).lean();
    return Response.json({ services: services.map((service) => ({ ...service, classification: service.classification || classifyService(service.category, service.name) })) });
  }
  catch { return Response.json({ error: "Could not load services." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check the service details." }, { status: 400 });
    const values = validateServiceFields(body);
    if (!values) return Response.json({ error: "Check the service details and price range." }, { status: 400 });
    await connectDb(); const service = await Service.create({ ...values, image: "/images/hero.jpg" });
    return Response.json({ service }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return Response.json({ error: "A service already uses that name." }, { status: 409 });
    return Response.json({ error: "Service could not be created." }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body) || !mongoose.isValidObjectId(body.id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    const values = validateServiceFields(body);
    if (!values) return Response.json({ error: "Check the service details and price range." }, { status: 400 });
    await connectDb();
    const update = values.active
      ? { $set: values, $unset: { archivedAt: 1 } }
      : { $set: { ...values, archivedAt: new Date() } };
    const service = await Service.findByIdAndUpdate(body.id, update, { returnDocument: "after", runValidators: true });
    return service ? Response.json({ service }) : Response.json({ error: "Service not found." }, { status: 404 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return Response.json({ error: "A service already uses that name." }, { status: 409 });
    return Response.json({ error: "Service could not be saved." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    await connectDb();
    const service = await Service.findById(id);
    if (!service) return Response.json({ error: "Service not found." }, { status: 404 });
    const hasHistory = Boolean(await Booking.exists({ "service.id": service._id }));
    if (serviceRemovalAction(hasHistory) === "archive") {
      service.active = false; service.archivedAt = new Date(); await service.save();
      return Response.json({ service, archived: true });
    }
    const imagePublicId = service.imagePublicId;
    await service.deleteOne();
    if (imagePublicId) await import("@/lib/cloudinary").then(({ destroyCloudinaryImage }) => destroyCloudinaryImage(imagePublicId).catch(() => false));
    return Response.json({ deleted: true });
  } catch { return Response.json({ error: "Service could not be removed." }, { status: 503 }); }
}
