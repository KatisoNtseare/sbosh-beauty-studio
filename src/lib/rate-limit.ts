import { createHash } from "node:crypto";
import { isIP } from "node:net";
import RateLimit from "@/models/RateLimit";

/** A Mongo-backed fixed-window limiter shared by app instances. */
export async function withinRateLimit(scope: string, key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const digest = createHash("sha256").update(key).digest("hex");
  const id = `${scope}:${window}:${digest}`;
  const record = await RateLimit.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  return Number(record?.count ?? limit + 1) <= limit;
}

export function requestIp(request: Request, trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true") {
  const platformIp = (request as Request & { ip?: unknown }).ip;
  if (typeof platformIp === "string" && isIP(platformIp)) return platformIp;
  if (!trustProxyHeaders) return "unknown";

  // Only enable this when ingress overwrites a single client IP and direct origin access is blocked.
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const address = forwarded || realIp || "";
  return isIP(address) ? address : "unknown";
}
