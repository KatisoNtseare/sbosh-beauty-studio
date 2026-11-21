import { vi } from "vitest";
import { validateTestDatabaseUri } from "@/lib/test-database-config";

const smtpMock = vi.hoisted(() => {
  const sendMail = vi.fn(async () => ({ messageId: "integration-test" }));
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport: smtpMock.createTransport } }));
Object.assign(globalThis, { __integrationSmtpMock: smtpMock });

process.env.ZOHO_SMTP_HOST = "smtp.invalid";
process.env.ZOHO_SMTP_PORT = "587";
process.env.ZOHO_SMTP_USER = "integration@example.test";
process.env.ZOHO_SMTP_PASS = "integration-only-fake-password";
process.env.CONTACT_RECEIVER = "admin@example.test";

const testUri = process.env.MONGODB_TEST_URI;
validateTestDatabaseUri(testUri);

// The application connector reads MONGODB_URI. Set it only from the validated test-only variable.
process.env.MONGODB_URI = testUri!;
process.env.AUTH_SECRET = "integration-only-secret-that-is-never-used-outside-tests";
process.env.TRUST_PROXY_HEADERS = "true";
