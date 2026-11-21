import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import Availability from "../src/models/Availability";
import { defaultWeeklySchedule, isDefaultWeeklySchedule } from "../src/lib/default-availability";

loadEnvConfig(process.cwd());

const TEST_DATABASE = "sbosh_beauty_test";
function databaseName(uri: string) {
  const parsed = new URL(uri);
  return decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] || "test");
}

async function main() {
  if (process.env.CONFIRM_MAIN_AVAILABILITY_UPDATE !== "yes") {
    throw new Error("Set CONFIRM_MAIN_AVAILABILITY_UPDATE=yes to update the configured main application database.");
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required; the test database is never used as a fallback.");
  if (databaseName(uri) === TEST_DATABASE) throw new Error("Refusing to update sbosh_beauty_test.");

  const testUri = process.env.MONGODB_TEST_URI;
  if (testUri && uri === testUri) throw new Error("MONGODB_URI and MONGODB_TEST_URI must not be the same connection.");

  await mongoose.connect(uri);
  try {
    const db = mongoose.connection.db;
    if (!db || db.databaseName === TEST_DATABASE) throw new Error("Refusing to update the isolated integration database.");

    const existing = await Availability.find({}).select("_id").limit(2).lean();
    if (existing.length > 1) throw new Error("More than one Availability document exists; no schedule changes were made.");

    if (existing.length === 1) {
      await Availability.updateOne({ _id: existing[0]._id }, { $set: { weekly: defaultWeeklySchedule, timeZone: "Africa/Johannesburg" } }, { runValidators: true });
    } else {
      await Availability.create({ weekly: defaultWeeklySchedule, timeZone: "Africa/Johannesburg" });
    }

    const saved = await Availability.findOne().select("weekly timeZone").lean();
    if (!isDefaultWeeklySchedule(saved?.weekly) || saved?.timeZone !== "Africa/Johannesburg") {
      throw new Error("The schedule update did not pass read-back verification.");
    }

    console.log(`Verified seven recurring days at 09:00–17:30 in main database "${db.databaseName}" (${saved.timeZone}).`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Main database schedule update failed.");
  process.exitCode = 1;
});
