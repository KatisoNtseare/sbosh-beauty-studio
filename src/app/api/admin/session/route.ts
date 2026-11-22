import { validAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const authenticated = await validAdminSession();
  return Response.json({ authenticated }, { headers: { "Cache-Control": "no-store" } });
}
