import { beforeEach, describe, expect, it, vi } from "vitest";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { canTransitionBooking, classifyService, hasOverlappingInterval, serviceRemovalAction, snapshotService, validateCustomerFields, validateServiceFields } from "@/lib/domain";

let schedule: Record<string, unknown>;
let reservations: { reservations: { bookingId: string; start: number; end: number }[] } | null;
vi.mock("@/models/Availability", () => ({ default: { findOne: vi.fn(() => ({ lean: async () => schedule })) } }));
vi.mock("@/models/ReservationDay", () => ({ default: { findOne: vi.fn(() => ({ lean: async () => reservations })) } }));
import { slotsFor, todayInSalon, validDate } from "@/lib/availability";

const nextDate = (offset = 2) => {
  const date = new Date(todayInSalon() + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

describe("service classification and lifecycle", () => {
  it("classifies existing service names and categories safely", () => {
    expect(classifyService("Beauty", "Lash extensions")).toBe("LASHES");
    expect(classifyService("Nail services", "Overlay")).toBe("NAILS");
    expect(classifyService("Beauty", "Toe treatment")).toBe("TOES");
    expect(classifyService("Other", "Consultation")).toBe("GENERAL");
  });
  it("keeps configured appointment lengths per service", () => {
    expect(validateServiceFields({ name: "Lash fill", category: "Lashes", durationMinutes: 45 })?.durationConfirmed).toBe(false);
    expect(validateServiceFields({ name: "Lash fill", category: "Lashes", durationMinutes: 45, durationConfirmed: true })?.durationConfirmed).toBe(true);
    expect(validateServiceFields({ name: "Nails", durationMinutes: 600 })?.classification).toBe("NAILS");
    expect(validateServiceFields({ name: "Nail Repair" })?.durationMinutes).toBeUndefined();
  });
  it("validates service price ranges and classification", () => {
    expect(validateServiceFields({ name: "Gel Nails", minimumPrice: "200", maximumPrice: "350" })).toMatchObject({ minimumPrice: 200, maximumPrice: 350, classification: "NAILS", active: true });
    expect(validateServiceFields({ name: "X", minimumPrice: 400, maximumPrice: 200 })).toBeNull();
  });
  it("keeps configured duration and price in the submitted service snapshot", () => {
    const submitted = snapshotService({ _id: "service-1", name: "Overlay", category: "Nails", minimumPrice: 250, durationMinutes: 75, durationConfirmed: true, description: "Short" });
    expect(submitted).toMatchObject({ name: "Overlay", minimumPrice: 250, classification: "NAILS", durationMinutes: 75 });
    expect(snapshotService({ _id: "service-2", name: "Nail Repair", category: "Additional Services" }).durationMinutes).toBeUndefined();
  });
  it("archives services with history and declares unique model indexes", () => {
    expect(serviceRemovalAction(true)).toBe("archive");
    expect(serviceRemovalAction(false)).toBe("delete");
    expect(Service.schema.indexes().some(([index, options]) => index.name === 1 && options.unique === true)).toBe(true);
    expect(Booking.schema.indexes().some(([index, options]) => index.reference === 1 && options.unique === true)).toBe(true);
    expect((Booking.schema.path("status") as unknown as { defaultValue: string }).defaultValue).toBe("PENDING");
  });
});

describe("booking validation and transitions", () => {
  it("requires a valid customer email and accepts an optional phone and notes", () => {
    expect(validateCustomerFields({ name: "Amahle", email: "AMA@EXAMPLE.COM" })).toEqual({ name: "Amahle", email: "ama@example.com", description: "" });
    expect(validateCustomerFields({ name: "A", email: "not-an-email" })).toBeNull();
    expect(validateCustomerFields({ name: "Amahle", email: "ama@example.com", phone: "x".repeat(31) })).toBeNull();
    expect(validateCustomerFields({ name: "Amahle", email: "ama@example.com", description: "x".repeat(5001) })).toBeNull();
  });
  it("allows only valid status transitions", () => {
    expect(canTransitionBooking("PENDING", "approve")).toBe(true);
    expect(canTransitionBooking("PENDING", "reject")).toBe(true);
    expect(canTransitionBooking("APPROVED", "reject")).toBe(false);
    expect(canTransitionBooking("COMPLETED", "complete")).toBe(false);
  });
});

describe("appointment availability", () => {
  beforeEach(() => {
    const date = nextDate();
    schedule = { weekly: [{ weekday: new Date(date + "T12:00:00Z").getUTCDay(), enabled: true, periods: [{ open: "09:00", close: "12:00" }, { open: "13:00", close: "18:00" }] }], exceptions: [], blockedDates: [], blockedPeriods: [{ date, start: "15:00", end: "16:00" }], breaks: [{ start: "12:00", end: "13:00" }], slotMinutes: 60, bufferMinutes: 0, timeZone: "Africa/Johannesburg" };
    reservations = { reservations: [{ bookingId: "existing-booking", start: 600, end: 660 }] };
  });
  it("uses trusted duration with multiple periods, breaks, blocked intervals and reservations", async () => {
    expect(await slotsFor(nextDate(), 60)).toEqual(["09:00", "11:00", "13:00", "14:00", "16:00", "17:00"]);
  });
  it("applies the weekday rule every week and closes only one occurrence", async () => {
    const date = nextDate();
    const nextWeek = new Date(date + "T12:00:00Z"); nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    const nextMonday = nextWeek.toISOString().slice(0, 10);
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    schedule = { weekly: [{ weekday, enabled: true, periods: [{ open: "09:00", close: "17:00" }] }], blockedDates: [date], exceptions: [], blockedPeriods: [], breaks: [], slotMinutes: 30, bufferMinutes: 0 };
    reservations = null;
    expect(await slotsFor(date, 120)).toEqual([]);
    expect(await slotsFor(nextMonday, 120)).toContain("15:00");
    expect(await slotsFor(nextMonday, 120)).not.toContain("15:30");
  });
  it("carries the recurring weekday schedule across a month boundary", async () => {
    const date = "2099-01-29";
    const nextWeek = new Date(date + "T12:00:00Z");
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    const nextMonthDate = nextWeek.toISOString().slice(0, 10);
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    schedule = { weekly: [{ weekday, enabled: true, periods: [{ open: "09:00", close: "17:00" }] }], blockedDates: [date], exceptions: [], blockedPeriods: [], breaks: [], slotMinutes: 30, bufferMinutes: 0 };
    reservations = null;
    expect(nextMonthDate.slice(5, 7)).toBe("02");
    expect(await slotsFor(date, 120)).toEqual([]);
    expect(await slotsFor(nextMonthDate, 120)).toContain("15:00");
  });
  it("ignores old one-off openings and retains old closed exceptions", async () => {
    const date = nextDate();
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    schedule = { weekly: [{ weekday, enabled: true, periods: [{ open: "09:00", close: "12:00" }] }], exceptions: [{ date, enabled: true, periods: [{ open: "10:00", close: "12:00" }] }], blockedDates: [], blockedPeriods: [], breaks: [], slotMinutes: 60, bufferMinutes: 0 };
    reservations = null;
    expect(await slotsFor(date, 60)).toEqual(["09:00", "10:00", "11:00"]);
    schedule = { ...schedule, exceptions: [{ date, enabled: false, periods: [] }] };
    expect(await slotsFor(date, 60)).toEqual([]);
  });
  it("validates future salon dates and rejects malformed calendar dates", () => {
    expect(validDate(nextDate())).toBe(true);
    expect(validDate("2026-02-31")).toBe(false);
    expect(validDate("2020-01-01")).toBe(false);
  });
  it("rejects overlapping intervals and allows adjacent appointments", () => {
    expect(hasOverlappingInterval(630, 690, [{ start: 600, end: 660 }])).toBe(true);
    expect(hasOverlappingInterval(660, 720, [{ start: 600, end: 660 }])).toBe(false);
  });
});
