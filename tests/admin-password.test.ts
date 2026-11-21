import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin-password";

describe("administrator password hashing", () => {
  it("verifies the password using the stored salt and hash", () => {
    const { salt, hash } = hashAdminPassword("Correct horse battery staple");
    expect(verifyAdminPassword("Correct horse battery staple", salt, hash)).toBe(true);
    expect(verifyAdminPassword("different password", salt, hash)).toBe(false);
  });

  it("rejects malformed hash material", () => {
    expect(verifyAdminPassword("password", "bad", "bad")).toBe(false);
  });
});
