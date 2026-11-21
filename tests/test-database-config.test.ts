import { describe, expect, it } from "vitest";
import { validateTestDatabaseUri } from "@/lib/test-database-config";

describe("integration database isolation", () => {
  it("accepts only the local replica-set test database", () => {
    const uri = validateTestDatabaseUri("mongodb://127.0.0.1:27018/sbosh_beauty_test?replicaSet=rs0");
    expect(uri.hostname).toBe("127.0.0.1");
    expect(uri.pathname).toBe("/sbosh_beauty_test");
    expect(uri.searchParams.get("replicaSet")).toBe("rs0");
  });

  it.each([
    undefined,
    "mongodb+srv://user:secret@cluster.example/sbosh_beauty_test?replicaSet=rs0",
    "mongodb://127.0.0.1:27018/production?replicaSet=rs0",
    "mongodb://127.0.0.1:27018/sbosh_beauty_test",
    "mongodb://127.0.0.1,cluster.example:27018/sbosh_beauty_test?replicaSet=rs0",
  ])("rejects an unsafe or incomplete test URI (%s)", (uri) => {
    expect(() => validateTestDatabaseUri(uri)).toThrow();
  });
});
