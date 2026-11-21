import { createHash } from "node:crypto";
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
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return Number(record?.count ?? limit + 1) <= limit;
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",").at(-1)?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return address.slice(0, 100);
}
