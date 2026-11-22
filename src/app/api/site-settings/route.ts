import { getStudioContact } from "@/lib/site-settings";

export async function GET() {
  return Response.json({ contact: await getStudioContact() });
}
