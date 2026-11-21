import { beforeEach, describe, expect, it, vi } from "vitest";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { buildWhatsAppMessage, canTransitionBooking, hasOverlappingInterval, messageTypeForStatus, normalizeSouthAfricanPhone, serviceRemovalAction, snapshotService, validateCustomerFields, validateServiceFields, whatsappUrl } from "@/lib/domain";

let schedule: Record<string, unknown>;
let reservations: { reservations: { bookingId: string; start: number; end: number }[] } | null;
vi.mock("@/models/Availability", () => ({ default: { findOne: vi.fn(() => ({ lean: async () => schedule })) } }));
vi.mock("@/models/ReservationDay", () => ({ default: { findOne: vi.fn(() => ({ lean: async () => reservations })) } }));
import { slotsFor, todayInSalon, validDate } from "@/lib/availability";

const futureSalonDate = (days = 2) => {
  const date = new Date(`${todayInSalon()}T12:00:00+02:00`);
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
};

describe("service lifecycle and snapshots", () => {
  it("validates create and edit fields including numeric price ranges", () => {
    const created = validateServiceFields({ name: "Manicure", minimumPrice: "200", maximumPrice: "350", durationMinutes: "60" });
    expect(created).toMatchObject({ name: "Manicure", minimumPrice: 200, maximumPrice: 350, durationMinutes: 60, active: true });
    expect(validateServiceFields({ name: "X", minimumPrice: 400, maximumPrice: 200 })).toBeNull();
    expect(validateServiceFields({ name: "Gel", durationMinutes: 601 })).toBeNull();
  });

  it("keeps the submitted service fields independent from later edits", () => {
    const submitted = snapshotService({ _id: "service-1", name: "Overlay", minimumPrice: 250, durationMinutes: 75, description: "Short" });
    const laterEdit = { name: "Overlay Plus", minimumPrice: 500, durationMinutes: 90 };
    expect(laterEdit.name).not.toBe(submitted.name);
    expect(submitted).toMatchObject({ name: "Overlay", minimumPrice: 250, durationMinutes: 75 });
  });

  it("archives services with history and deletes only unused services", () => {
    expect(serviceRemovalAction(true)).toBe("archive");
    expect(serviceRemovalAction(false)).toBe("delete");
  });

  it("declares unique service names and booking references plus pending defaults", () => {
    expect(Service.schema.indexes().some(([index, options]) => index.name === 1 && options.unique === true)).toBe(true);
    expect(Booking.schema.indexes().some(([index, options]) => index.reference === 1 && options.unique === true)).toBe(true);
    expect((Booking.schema.path("status") as unknown as { defaultValue: string }).defaultValue).toBe("PENDING");
  });
});

describe("booking and WhatsApp rules", () => {
  const booking = { customer: { name: "Amahle" }, service: { name: "Gel Nails" }, reference: "SB-2026-ABCD", confirmedDate: "2026-12-01", confirmedStart: "10:00", preferredDate: "2026-12-01", rejectionReason: "No availability" };
  it("normalizes South African mobile numbers and rejects malformed ones", () => {
    expect(normalizeSouthAfricanPhone("081 317 9144")).toBe("+27813179144");
    expect(normalizeSouthAfricanPhone("27813179144")).toBe("+27813179144");
    expect(normalizeSouthAfricanPhone("08123")).toBeNull();
  });

  it("validates customer details and preserves the full booking description", () => {
    const description = "A detailed request with style, colour, length and references.";
    expect(validateCustomerFields({ name: "Amahle", phone: "081 317 9144", description })).toEqual({ name: "Amahle", phone: "+27813179144", description });
    expect(validateCustomerFields({ name: "A", phone: "0813179144", description })).toBeNull();
    expect(validateCustomerFields({ name: "Amahle", phone: "0813179144", email: "not-an-email", description })).toBeNull();
    expect(validateCustomerFields({ name: "Amahle", phone: "0813179144", description: "x".repeat(5001) })).toBeNull();
  });

  it("maps only the permitted message to each final booking status", () => {
    expect(messageTypeForStatus("PENDING")).toBeNull();
    expect(messageTypeForStatus("APPROVED")).toBe("BOOKING_CONFIRMATION");
    expect(messageTypeForStatus("REJECTED")).toBe("REJECTION_NOTIFICATION");
    expect(messageTypeForStatus("COMPLETED")).toBe("THANK_YOU");
    expect(canTransitionBooking("PENDING", "mark-sent")).toBe(false);
    expect(canTransitionBooking("REJECTED", "mark-sent")).toBe(true);
    expect(canTransitionBooking("APPROVED", "reject")).toBe(false);
    expect(canTransitionBooking("PENDING", "approve")).toBe(true);
    expect(canTransitionBooking("COMPLETED", "complete")).toBe(false);
  });

  it("encodes full manual WhatsApp messages and retains the studio identity", () => {
    const message = buildWhatsAppMessage(booking, "BOOKING_CONFIRMATION");
    const url = whatsappUrl("0813179144", message);
    expect(url).toContain("https://wa.me/27813179144?text=");
    expect(decodeURIComponent(url)).toContain("Sbosh's Beauty Studio");
    expect(decodeURIComponent(url)).toContain("SB-2026-ABCD");
  });
});

describe("appointment availability", () => {
  beforeEach(() => {
    schedule = { weekly: [{ weekday: new Date(`${futureSalonDate()}T12:00:00+02:00`).getDay(), enabled: true, periods: [{ open: "09:00", close: "12:00" }, { open: "13:00", close: "18:00" }] }], exceptions: [], blockedDates: [], blockedPeriods: [{ date: futureSalonDate(), start: "15:00", end: "16:00" }], breaks: [{ start: "12:00", end: "13:00" }], slotMinutes: 60, bufferMinutes: 0, timeZone: "Africa/Johannesburg" };
    reservations = { reservations: [{ bookingId: "existing-booking", start: 600, end: 660 }] };
  });

  it("uses service length, multiple periods, breaks, blocked intervals and existing reservations", async () => {
    expect(await slotsFor(futureSalonDate(), 60)).toEqual(["09:00", "11:00", "13:00", "14:00", "16:00", "17:00"]);
  });

  it("uses date exceptions instead of weekday hours and respects blocked dates", async () => {
    const date = futureSalonDate();
    schedule = { ...schedule, exceptions: [{ date, enabled: true, periods: [{ open: "10:00", close: "12:00" }] }] };
    expect(await slotsFor(date, 60)).toEqual(["11:00"]);
    schedule = { ...schedule, blockedDates: [date] };
    expect(await slotsFor(date, 60)).toEqual([]);
  });

  it("validates salon-local future dates without accepting malformed calendar dates", () => {
    expect(validDate(futureSalonDate())).toBe(true);
    expect(validDate("2026-02-31")).toBe(false);
    expect(validDate("2020-01-01")).toBe(false);
  });

  it("rejects overlapping intervals and allows adjacent appointments", () => {
    expect(hasOverlappingInterval(630, 690, [{ start: 600, end: 660 }])).toBe(true);
    expect(hasOverlappingInterval(660, 720, [{ start: 600, end: 660 }])).toBe(false);
  });
});
