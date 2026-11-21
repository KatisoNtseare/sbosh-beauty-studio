import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import Admin from "../src/models/Admin";
import { hashAdminPassword } from "../src/lib/admin-password";

class SeedConfigError extends Error {}

async function main() {
  loadEnvConfig(process.cwd());

  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || email;

  if (!uri || !email || !password || !name) {
    throw new SeedConfigError("Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in .env.local before seeding.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SeedConfigError("ADMIN_EMAIL must be a valid email address.");
  if (password.length < 12 || password.length > 256) throw new SeedConfigError("ADMIN_PASSWORD must contain 12 to 256 characters.");
  if (name.length > 120) throw new SeedConfigError("ADMIN_NAME must be 120 characters or fewer.");

  const { salt, hash } = hashAdminPassword(password);
  await mongoose.connect(uri, { bufferCommands: false });
  try {
    const update = { $set: { email, name, passwordSalt: salt, passwordHash: hash, active: true } };
    const currentEmail = await Admin.findOne({ email }).select("_id").lean();
    if (currentEmail) {
      await Admin.updateOne({ _id: currentEmail._id }, update, { runValidators: true });
    } else {
      const existingAdmins = await Admin.find().select("_id").limit(2).lean();
      if (existingAdmins.length > 1) {
        throw new SeedConfigError("Multiple admin accounts exist. Set ADMIN_EMAIL to an existing account before changing its email.");
      }
      if (existingAdmins.length === 1) {
        await Admin.updateOne({ _id: existingAdmins[0]._id }, update, { runValidators: true });
      } else {
        await Admin.updateOne({ email }, update, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
      }
    }
    const verified = await Admin.exists({ email, active: true });
    if (!verified) throw new SeedConfigError("The administrator record could not be verified after seeding.");
    console.log("Administrator account updated in the database.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof SeedConfigError ? error.message : "Administrator seeding failed. Check the database configuration and access.";
  console.error(message);
  process.exitCode = 1;
});
