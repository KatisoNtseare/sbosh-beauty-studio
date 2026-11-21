import { validateTestDatabaseUri } from "@/lib/test-database-config";

const testUri = process.env.MONGODB_TEST_URI;
validateTestDatabaseUri(testUri);

// The application connector reads MONGODB_URI. Set it only from the validated test-only variable.
process.env.MONGODB_URI = testUri!;
process.env.AUTH_SECRET = "integration-only-secret-that-is-never-used-outside-tests";
process.env.TRUST_PROXY_HEADERS = "true";
