export const integrationDatabaseName = "sbosh_beauty_test";

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function validateTestDatabaseUri(value: string | undefined) {
  if (!value) throw new Error("MONGODB_TEST_URI is required. Integration tests never fall back to MONGODB_URI.");

  let parsed: URL;
  try { parsed = new URL(value); }
  catch { throw new Error("MONGODB_TEST_URI must be a valid local MongoDB URL."); }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] ?? "");
  if (parsed.protocol !== "mongodb:" || !localHosts.has(parsed.hostname) || databaseName !== integrationDatabaseName) {
    throw new Error("MONGODB_TEST_URI must target the local sbosh_beauty_test database.");
  }
  if (!parsed.searchParams.get("replicaSet")?.trim()) {
    throw new Error("MONGODB_TEST_URI must specify the local replicaSet name (for example replicaSet=rs0).");
  }

  return parsed;
}
