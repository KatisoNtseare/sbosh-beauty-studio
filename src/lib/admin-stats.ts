const BOOKING_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"] as const;

export function calculateBookingStats(counts: Record<string, number>) {
  return {
    requests: BOOKING_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0),
    pending: counts.PENDING ?? 0,
    approved: counts.APPROVED ?? 0,
    rejected: counts.REJECTED ?? 0,
    completed: counts.COMPLETED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
    upcoming: counts.UPCOMING ?? 0,
  };
}
