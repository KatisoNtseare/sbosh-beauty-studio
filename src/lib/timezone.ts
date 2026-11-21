import { businessProfile } from "@/lib/brand";

export function dateKeyInTimezone(date: Date, timeZone: string = businessProfile.timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInSalon(now = new Date()) {
  return dateKeyInTimezone(now);
}

