import { vi } from "vitest";

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: vi.fn(async () => ({ messageId: "integration-test" })) }) },
}));

const testUri = process.env.MONGODB_TEST_URI;
if (!testUri) throw new Error("MONGODB_TEST_URI is required. Integration tests never fall back to MONGODB_URI.");

let parsed: URL;
try {
  parsed = new URL(testUri);
} catch {
  throw new Error("MONGODB_TEST_URI must be a valid MongoDB connection URL.");
}

const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] ?? "");
const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
if (parsed.protocol !== "mongodb:" || !localHosts.has(parsed.hostname)) {
  throw new Error("Integration tests only connect to a local MongoDB test instance.");
}
if (!(["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) || databaseName !== "sbosh_beauty_test") {
  throw new Error("Integration tests require an explicit URI for the isolated sbosh_beauty_test database.");
}

// The application connector reads MONGODB_URI. Set it only from the validated test-only variable.
process.env.MONGODB_URI = testUri;
process.env.AUTH_SECRET = "integration-only-secret-that-is-never-used-outside-tests";
process.env.TRUST_PROXY_HEADERS = "true";
