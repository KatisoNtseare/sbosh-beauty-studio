import { connectDb } from "@/lib/mongodb";
import { validAdminSession } from "@/lib/admin-auth";
import SiteSettings from "@/models/SiteSettings";
import { getSiteSettings, normalizeContactNumber, validContactEmail } from "@/lib/site-settings";

export async function GET() {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ settings: await getSiteSettings() });
}

export async function PATCH(request: Request) {
  if (!(await validAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Enter valid site settings." }, { status: 400 });
    const phoneNumber = normalizeContactNumber(body.phoneNumber);
    const whatsappNumber = normalizeContactNumber(body.whatsappNumber);
    const email = validContactEmail(body.email);
    if (!phoneNumber || !whatsappNumber || !email) return Response.json({ error: "Enter valid international phone numbers and a valid email address." }, { status: 400 });

    await connectDb();
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      { $set: { phoneNumber, whatsappNumber, email }, $setOnInsert: { key: "main" } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return Response.json({ settings: { phoneNumber: settings?.phoneNumber, whatsappNumber: settings?.whatsappNumber, email: settings?.email } });
  } catch {
    return Response.json({ error: "Site settings could not be saved." }, { status: 503 });
  }
}
