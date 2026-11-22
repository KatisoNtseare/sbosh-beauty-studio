import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import Booking from "@/models/Booking";
import { classifyService, serviceRemovalAction, validateServiceFields } from "@/lib/domain";
import { defaultCatalogueImage } from "@/lib/brand";

function serviceResponse(service: Record<string, unknown>) {
  const clean = { ...service };
  if (!clean.image || clean.image === "/images/hero.jpg") clean.image = defaultCatalogueImage;
  delete clean.durationMinutes;
  delete clean.durationConfirmed;
  return { ...clean, extras: Array.isArray(clean.extras) ? clean.extras.map((extra) => {
    if (!extra || typeof extra !== "object") return extra;
    const item = { ...(extra as Record<string, unknown>) };
    delete item.durationMinutes;
    return item;
  }) : clean.extras };
}

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb();
    const services = await Service.find().select("name description fullDescription image imagePublicId priceLabel price priceConfirmed minimumPrice maximumPrice extras classification category displayOrder active archivedAt createdAt updatedAt").sort({ name: 1 }).lean();
    return Response.json({ services: services.map((service) => serviceResponse({ ...service, classification: service.classification || classifyService(service.category, service.name) })) });
  }
  catch { return Response.json({ error: "Could not load services." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check the service details." }, { status: 400 });
    const values = validateServiceFields(body);
    if (!values) return Response.json({ error: "Check the service details and price range." }, { status: 400 });
    await connectDb(); const service = await Service.create({ ...values, image: defaultCatalogueImage });
    return Response.json({ service: serviceResponse(service.toObject()) }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return Response.json({ error: "A service already uses that name." }, { status: 409 });
    return Response.json({ error: "Service could not be created." }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = body && typeof body === "object" ? (body.id ?? body._id) : undefined;
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof id !== "string" || !mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid service." }, { status: 400 });
    const values = validateServiceFields(body);
    if (!values) return Response.json({ error: "Check the service details and price range." }, { status: 400 });
    await connectDb();
    const update = values.active
      ? { $set: values, $unset: { archivedAt: 1 } }
      : { $set: { ...values, archivedAt: new Date() } };
    const service = await Service.findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true });
    return service ? Response.json({ service: serviceResponse(service.toObject()) }) : Response.json({ error: "Service not found." }, { status: 404 });
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
    const hasHistory = Boolean(await Booking.exists({ "service.id": service._id }) || await ServicePackage.exists({ serviceIds: service._id }));
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
