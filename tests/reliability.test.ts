import { describe, expect, it } from "vitest";
import { calculateBookingStats } from "@/lib/admin-stats";
import { bookingSubmissionFingerprint, sameBookingSubmission } from "@/lib/idempotency";
import { requestIp } from "@/lib/rate-limit";
import { dateKeyInTimezone, todayInSalon } from "@/lib/timezone";

const secret = "a-test-secret-that-is-long-enough-for-hmac";
const submission = {
  customer: { name: "Customer One", phone: "+27813179144", email: "customer@example.test", description: "A detailed request" },
  serviceId: "507f1f77bcf86cd799439011",
  date: "2026-12-15",
  time: "10:00",
};

describe("booking idempotency scope", () => {
  it("matches the same normalized payload and rejects a different payload", () => {
    const fingerprint = bookingSubmissionFingerprint(submission, secret);
    const prior = { ...submission, service: { id: submission.serviceId }, description: submission.customer.description, preferredDate: submission.date, preferredTime: submission.time, idempotencyFingerprint: fingerprint };
    expect(sameBookingSubmission(prior, fingerprint, submission, secret)).toBe(true);
    expect(sameBookingSubmission(prior, fingerprint, { ...submission, time: "11:00" }, secret)).toBe(false);
  });

  it("binds a submission fingerprint to the request content and customer identity", () => {
    const fingerprint = bookingSubmissionFingerprint(submission, secret);
    expect(bookingSubmissionFingerprint({ ...submission, customer: { ...submission.customer, phone: "+27821112222" } }, secret)).not.toBe(fingerprint);
    expect(bookingSubmissionFingerprint({ ...submission, serviceId: "507f1f77bcf86cd799439012" }, secret)).not.toBe(fingerprint);
  });

  it("does not accept a matching key without a matching request fingerprint", () => {
    const fingerprint = bookingSubmissionFingerprint(submission, secret);
    expect(bookingSubmissionFingerprint({ ...submission, customer: { ...submission.customer, name: "A different customer" } }, secret)).not.toBe(fingerprint);
  });
});

describe("admin request statistics", () => {
  it("counts each booking exactly once and treats upcoming as a subset of approved", () => {
    expect(calculateBookingStats({ PENDING: 2, APPROVED: 3, REJECTED: 4, COMPLETED: 5, CANCELLED: 6, UPCOMING: 2 })).toEqual({
      requests: 20, pending: 2, approved: 3, rejected: 4, completed: 5, cancelled: 6, upcoming: 2,
    });
  });
});

describe("salon timezone dates", () => {
  it("uses the salon date when it differs from a visitor's local date", () => {
    const instant = new Date("2026-11-20T22:30:00.000Z");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-11-20");
    expect(dateKeyInTimezone(instant, "America/Los_Angeles")).toBe("2026-11-20");
    expect(dateKeyInTimezone(instant)).toBe("2026-11-21");
  });

  it("handles the South African new-year boundary consistently", () => {
    expect(todayInSalon(new Date("2026-12-31T22:30:00.000Z"))).toBe("2027-01-01");
  });
});

describe("rate limit client IP trust", () => {
  it("ignores spoofed forwarding headers unless trusted proxy mode is enabled", () => {
    const request = new Request("https://studio.example/api", { headers: { "x-forwarded-for": "198.51.100.90" } });
    expect(requestIp(request, false)).toBe("unknown");
    expect(requestIp(request, true)).toBe("198.51.100.90");
  });

  it("rejects proxy header chains and invalid IP values", () => {
    const chained = new Request("https://studio.example/api", { headers: { "x-forwarded-for": "198.51.100.1, 203.0.113.7" } });
    const invalid = new Request("https://studio.example/api", { headers: { "x-real-ip": "client-controlled" } });
    expect(requestIp(chained, true)).toBe("unknown");
    expect(requestIp(invalid, true)).toBe("unknown");
  });

  it("uses a platform-supplied IP when available and has a safe missing-IP fallback", () => {
    const request = new Request("https://studio.example/api");
    Object.assign(request, { ip: "203.0.113.15" });
    expect(requestIp(request, false)).toBe("203.0.113.15");
    expect(requestIp(new Request("https://studio.example/api"), false)).toBe("unknown");
  });
});
