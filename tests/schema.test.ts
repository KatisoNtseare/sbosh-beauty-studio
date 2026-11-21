import { describe, expect, it } from "vitest";
import Booking from "@/models/Booking";
import Admin from "@/models/Admin";
import RateLimit from "@/models/RateLimit";
import ReservationDay from "@/models/ReservationDay";
import Service from "@/models/Service";
import ServicePackage from "@/models/ServicePackage";

describe("MongoDB schema safeguards", () => {
  it("declares unique service names, booking references, and salon-day reservation documents", () => {
    expect(Service.schema.indexes().some(([index, options]) => index.name === 1 && options.unique === true)).toBe(true);
    expect(Booking.schema.indexes().some(([index, options]) => index.reference === 1 && options.unique === true)).toBe(true);
    expect(Booking.schema.indexes().some(([index, options]) => index.idempotencyKey === 1 && options.unique === true && options.sparse === true)).toBe(true);
    expect(ReservationDay.schema.indexes().some(([index, options]) => index.date === 1 && options.unique === true)).toBe(true);
    expect(ServicePackage.schema.indexes().some(([index, options]) => index.name === 1 && options.unique === true)).toBe(true);
    expect(Service.schema.path("durationConfirmed")?.options.select).toBe(false);
    expect(ServicePackage.schema.path("additionalDurationMinutes")?.options.select).toBe(false);
    expect(Booking.schema.path("totalPrice")).toBeDefined();
    expect(Booking.schema.path("priceNeedsConfirmation")).toBeDefined();
  });

  it("does not expose idempotency fingerprints by default", () => {
    expect(Booking.schema.path("idempotencyFingerprint").options.select).toBe(false);
  });

  it("starts each booking as pending and expires shared rate-limit buckets", () => {
    expect((Booking.schema.path("status") as unknown as { defaultValue: string }).defaultValue).toBe("PENDING");
    expect(RateLimit.schema.indexes().some(([index, options]) => index.expiresAt === 1 && options.expireAfterSeconds === 0)).toBe(true);
  });

  it("enforces unique administrator email addresses and excludes password hashes by default", () => {
    expect(Admin.schema.indexes().some(([index, options]) => index.email === 1 && options.unique === true)).toBe(true);
    expect(Admin.schema.path("passwordHash").options.select).toBe(false);
    expect(Admin.schema.path("passwordSalt").options.select).toBe(false);
  });
});
