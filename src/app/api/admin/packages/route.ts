import mongoose from "mongoose";
import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";
import { validatePackageFields } from "@/lib/catalogue";

function packageResponse(value: Record<string, unknown>) {
  const result = { ...value };
  delete result.additionalDurationMinutes;
  return result;
}

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDb();
    const packages = await ServicePackage.find().sort({ displayOrder: 1, name: 1 }).lean();
    return Response.json({ packages: packages.map((item) => packageResponse(item)) });
  } catch { return Response.json({ error: "Could not load packages." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Check the package details." }, { status: 400 });
    const values = validatePackageFields(body);
    if (!values) return Response.json({ error: "Enter a package name and select at least two different services." }, { status: 400 });
    await connectDb();
    const activeCount = await Service.countDocuments({ _id: { $in: values.serviceIds }, active: true });
    if (activeCount !== values.serviceIds.length) return Response.json({ error: "Packages can include active services only." }, { status: 400 });
    const created = await ServicePackage.create(values);
    return Response.json({ package: packageResponse(created.toObject()) }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return Response.json({ error: "A package already uses that name." }, { status: 409 });
    return Response.json({ error: "Package could not be created." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || !mongoose.isValidObjectId(body.id)) return Response.json({ error: "Invalid package." }, { status: 400 });
    const values = validatePackageFields(body);
    if (!values) return Response.json({ error: "Enter a package name and select at least two different services." }, { status: 400 });
    await connectDb();
    const activeCount = await Service.countDocuments({ _id: { $in: values.serviceIds }, active: true });
    if (activeCount !== values.serviceIds.length) return Response.json({ error: "Packages can include active services only." }, { status: 400 });
    const updated = await ServicePackage.findByIdAndUpdate(body.id, values.active ? { $set: values, $unset: { archivedAt: 1 } } : { $set: { ...values, archivedAt: new Date() } }, { returnDocument: "after", runValidators: true });
    return updated ? Response.json({ package: packageResponse(updated.toObject()) }) : Response.json({ error: "Package not found." }, { status: 404 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return Response.json({ error: "A package already uses that name." }, { status: 409 });
    return Response.json({ error: "Package could not be saved." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid package." }, { status: 400 });
    await connectDb();
    const item = await ServicePackage.findById(id);
    if (!item) return Response.json({ error: "Package not found." }, { status: 404 });
    if (await Booking.exists({ "service.id": item._id })) {
      item.active = false; item.archivedAt = new Date(); await item.save();
      return Response.json({ package: packageResponse(item.toObject()), archived: true });
    }
    await item.deleteOne();
    return Response.json({ deleted: true });
  } catch { return Response.json({ error: "Package could not be removed." }, { status: 503 }); }
}
