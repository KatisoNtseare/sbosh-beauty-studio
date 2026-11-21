import { describe, expect, it } from "vitest";
import Booking from "@/models/Booking";
import RateLimit from "@/models/RateLimit";
import ReservationDay from "@/models/ReservationDay";
import Service from "@/models/Service";

describe("MongoDB schema safeguards", () => {
  it("declares unique service names, booking references, and salon-day reservation documents", () => {
    expect(Service.schema.indexes().some(([index, options]) => index.name === 1 && options.unique === true)).toBe(true);
    expect(Booking.schema.indexes().some(([index, options]) => index.reference === 1 && options.unique === true)).toBe(true);
    expect(ReservationDay.schema.indexes().some(([index, options]) => index.date === 1 && options.unique === true)).toBe(true);
  });

  it("starts each booking as pending and expires shared rate-limit buckets", () => {
    expect((Booking.schema.path("status") as unknown as { defaultValue: string }).defaultValue).toBe("PENDING");
    expect(RateLimit.schema.indexes().some(([index, options]) => index.expiresAt === 1 && options.expireAfterSeconds === 0)).toBe(true);
  });
});
