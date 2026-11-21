export const defaultWeeklySchedule = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  enabled: true,
  periods: [{ open: "09:00", close: "17:30" }],
}));

export function isDefaultWeeklySchedule(value: unknown) {
  if (!Array.isArray(value) || value.length !== 7) return false;
  const days = value as { weekday?: unknown; enabled?: unknown; periods?: { open?: unknown; close?: unknown }[] }[];
  const weekdays = new Set(days.map((day) => day.weekday));
  return weekdays.size === 7 && [0, 1, 2, 3, 4, 5, 6].every((weekday) => weekdays.has(weekday))
    && days.every((day) => day.enabled === true && day.periods?.length === 1
      && day.periods[0].open === "09:00" && day.periods[0].close === "17:30");
}
