import { connectDb } from "@/lib/mongodb";
import Availability from "@/models/Availability";
import Service from "@/models/Service";
import { classifyService } from "@/lib/domain";

async function migrate() {
  await connectDb();
  const services = await Service.find({ classification: { $exists: false } }).select("_id name category").lean();
  for (const service of services) {
    await Service.updateOne({ _id: service._id, classification: { $exists: false } }, { $set: { classification: classifyService(service.category, service.name) } });
  }
  const availability = await Availability.findOne();
  let closedDatesAdded = 0;
  let legacyOpeningRulesSaved = 0;
  let breaksMigrated = false;
  if (availability) {
    const oldExceptions = availability.exceptions ?? [];
    const closed = oldExceptions.filter((item: { enabled?: boolean }) => !item.enabled).map((item: { date: string }) => item.date);
    const openings = oldExceptions.filter((item: { enabled?: boolean }) => item.enabled).map((item: { date: string; periods?: { open: string; close: string }[]; open?: string; close?: string }) => ({
      date: item.date,
      periods: item.periods?.length ? item.periods : item.open && item.close ? [{ open: item.open, close: item.close }] : [],
    }));
    const existingDates = new Set(availability.blockedDates ?? []);
    const mergedClosed = [...existingDates, ...closed.filter((date: string) => !existingDates.has(date))];
    closedDatesAdded = mergedClosed.length - existingDates.size;
    const existingRules = new Set((availability.legacyOpeningRules ?? []).map((item: { date: string }) => item.date));
    const mergedOpenings = [...(availability.legacyOpeningRules ?? []), ...openings.filter((item: { date: string }) => !existingRules.has(item.date))];
    legacyOpeningRulesSaved = mergedOpenings.length;
    const breaks = [...(availability.breaks ?? [])];
    if (availability.breakStart && availability.breakEnd && !breaks.some((item: { start: string; end: string }) => item.start === availability.breakStart && item.end === availability.breakEnd)) {
      breaks.push({ start: availability.breakStart, end: availability.breakEnd });
      breaksMigrated = true;
    }
    availability.set({
      blockedDates: mergedClosed,
      legacyOpeningRules: mergedOpenings,
      breaks,
      exceptions: [],
      breakStart: undefined,
      breakEnd: undefined,
    });
    await availability.save();
  }
  console.log(JSON.stringify({
    migratedServices: services.length,
    closedDatesAdded,
    legacyOpeningRulesSaved,
    breaksMigrated,
    message: "Historical bookings and reservation records were not modified. Review legacyOpeningRules in /admin and recreate any recurring weekly hours that are still needed.",
  }, null, 2));
}

migrate().then(() => process.exit(0)).catch((error) => {
  console.error("Booking workflow migration failed.", error instanceof Error ? error.message : "Unknown migration error.");
  process.exit(1);
});
