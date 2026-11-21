"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaWhatsapp } from "react-icons/fa";
import { businessProfile } from "@/lib/brand";
import { calculateBookingStats } from "@/lib/admin-stats";

type Booking = {
  _id: string; reference: string; customer: { name: string; phone?: string; email?: string };
  service: { name: string; description?: string; fullDescription?: string; image?: string; price?: number; priceConfirmed?: boolean; priceLabel?: string; minimumPrice?: number; maximumPrice?: number; isPackage?: boolean; components?: { name: string; price?: number }[]; category?: string };
  extras?: { name: string; unitPrice: number; quantity: number; subtotal: number; method: string; componentName?: string }[]; totalPrice?: number; priceNeedsConfirmation?: boolean;
  description: string; preferredDate: string; preferredTime: string; confirmedDate?: string; confirmedStart?: string; confirmedEnd?: string;
  status: string; rejectionReason?: string; createdAt: string; history: { status: string; at: string; by: string; note?: string }[];
  notifications?: { _id: string; type: string; recipient: string; subject: string; status: string; attemptCount: number; attemptedAt?: string; sentAt?: string; lastFailure?: string }[];
};
type Period = { open: string; close: string };
type Day = { weekday: number; enabled: boolean; periods: Period[] };
type TimeBlock = { start: string; end: string };
type BlockedPeriod = TimeBlock & { date: string };
type AdminExtra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN" };
type AdminService = { _id: string; name: string; description: string; fullDescription: string; image: string; imagePublicId: string; priceLabel: string; price?: number; priceConfirmed: boolean; extras: AdminExtra[]; minimumPrice?: number; maximumPrice?: number; classification: "LASHES" | "NAILS" | "TOES" | "GENERAL"; category: string; displayOrder: number; active: boolean };
type AdminPackage = { _id: string; name: string; description: string; serviceIds: string[]; displayOrder: number; active: boolean };

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const input = "min-h-11 w-full rounded-xl border border-pale-blush bg-surface px-3 text-sm text-dark-text focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/15 disabled:opacity-50";
const blankPeriod = (): Period => ({ open: "09:00", close: "17:30" });
const blankWeekly = (): Day[] => dayNames.map((_, weekday) => ({ weekday, enabled: true, periods: [blankPeriod()] }));
const blankService = (): Omit<AdminService, "_id"> => ({ name: "", description: "", fullDescription: "", image: "/images/hero.jpg", imagePublicId: "", priceLabel: "", category: "Acrylic Nail Sets", classification: "NAILS", priceConfirmed: false, extras: [], displayOrder: 0, active: true });

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
}

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]); const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("ALL"); const [query, setQuery] = useState(""); const [dateFilter, setDateFilter] = useState(""); const [serviceFilter, setServiceFilter] = useState("ALL");
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1); const [total, setTotal] = useState(0); const [serviceNames, setServiceNames] = useState<string[]>([]); const [refreshVersion, setRefreshVersion] = useState(0);
  const [tab, setTab] = useState<"bookings" | "calendar" | "availability">("bookings"); const [calendarDate, setCalendarDate] = useState("");
  const notifySuccess = useCallback((message: string) => { setNotice(message); toast.success(message); }, []);
  const notifyError = useCallback((message: string) => { setError(message); toast.error(message); }, []);

  useEffect(() => {
    if (!authenticated) return;
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "ALL") params.set("status", status);
    if (query.trim()) params.set("customer", query.trim());
    if (dateFilter) params.set("date", dateFilter);
    if (serviceFilter !== "ALL") params.set("service", serviceFilter);
    void fetch(`/api/admin/bookings?${params}`).then(responseData).then((data) => { setBookings(data.bookings ?? []); setCounts(data.counts ?? {}); setPages(data.pages ?? 1); setTotal(data.total ?? 0); setServiceNames(data.services ?? []); }).catch((reason: Error) => notifyError(reason.message));
  }, [authenticated, dateFilter, notifyError, page, query, refreshVersion, serviceFilter, status]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { await responseData(await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) })); setAuthenticated(true); setPassword(""); }
    catch (reason) { notifyError(reason instanceof Error ? reason.message : "Sign-in failed."); }
  }

  async function updateBooking(id: string, payload: Record<string, unknown>) {
    setError(""); setNotice("");
    try {
      const result = await responseData(await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
      setRefreshVersion((version) => version + 1); notifySuccess(result.warning || "Booking updated.");
    } catch (reason) { notifyError(reason instanceof Error ? reason.message : "Booking could not be updated."); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); }
  const filtered = bookings;

  if (!authenticated) return <form onSubmit={login} className="mx-auto max-w-md rounded-3xl border border-pale-blush bg-surface p-7 shadow-xl shadow-deep-berry/5 sm:p-9">
    <p className="mb-2 text-xs font-semibold text-deep-berry">{businessProfile.name}</p><h1 className="mb-6 font-display text-5xl font-semibold text-deep-berry">Admin sign in</h1>
    <label className="mb-4 block text-sm">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={`${input} mt-2`}/></label>
    <label className="mb-5 block text-sm">Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className={`${input} mt-2`}/></label>
    <button className="min-h-12 w-full rounded-xl bg-strong-pink px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-raised-surface hover:text-silver">Sign in</button>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </form>;

  const stats = calculateBookingStats(counts);
  return <>
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold text-deep-berry">{businessProfile.name}</p><h1 className="font-display text-5xl font-semibold text-deep-berry md:text-6xl">Studio admin</h1></div><button onClick={() => void logout()} className="min-h-11 rounded-xl border border-pale-blush bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-soft-pink">Sign out</button></header>
    <nav aria-label="Admin sections" className="mb-7 flex flex-wrap gap-3 border-b border-pale-blush">{([["bookings", "Booking requests"], ["calendar", "Calendar"], ["availability", "Availability & services"]] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-3 py-3 text-sm ${tab === id ? "border-b-2 border-brand-pink font-semibold text-deep-berry" : "text-dark-text/70 hover:text-deep-berry"}`}>{label}</button>)}</nav>
    {error && <p role="alert" className="mb-4 rounded-xl border border-error/30 bg-surface p-3 text-sm">{error}</p>}{notice && <p role="status" className="mb-4 rounded-xl border border-brand-pink/25 bg-soft-pink p-3 text-sm text-deep-berry">{notice}</p>}
    {tab === "bookings" && <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">{[["Requests", stats.requests], ["Pending", stats.pending], ["Approved", stats.approved], ["Rejected", stats.rejected], ["Completed", stats.completed], ["Cancelled", stats.cancelled], ["Upcoming", stats.upcoming]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-pale-blush bg-surface p-4 shadow-sm"><p className="text-xs text-dark-text/70">{label}</p><p className="mt-1 font-display text-3xl font-semibold text-deep-berry">{value}</p></div>)}</div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={input}><option value="ALL">All statuses</option>{["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].map((value) => <option key={value}>{value}</option>)}</select><input placeholder="Customer, email or reference" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className={input}/><input type="date" aria-label="Filter by requested or confirmed date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} className={input}/><select value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(1); }} className={input}><option value="ALL">All services</option>{serviceNames.map((service) => <option key={service}>{service}</option>)}</select></div>
      <div className="space-y-3">{filtered.map((booking) => <BookingRow key={booking._id} booking={booking} onAction={(payload) => void updateBooking(booking._id, payload)}/>)}</div>
      {!filtered.length && <p className="border border-soft-border bg-surface p-8 text-center text-sm text-dark-text/70">No booking requests match these filters.</p>}
      {total > 0 && <div className="mt-5 flex items-center justify-between text-sm"><span>{total} requests · page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border border-soft-border px-4 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage(page + 1)} className="border border-soft-border px-4 py-2 disabled:opacity-40">Next</button></div></div>}
    </>}
    {tab === "calendar" && <BookingCalendar date={calendarDate} onDate={setCalendarDate}/>}
    {tab === "availability" && <AvailabilityAndServices onMessage={notifySuccess} onError={notifyError}/>}
  </>;
}

function BookingRow({ booking, onAction }: { booking: Booking; onAction: (payload: Record<string, unknown>) => void }) {
  const [reason, setReason] = useState("");
  const [confirmedPrice, setConfirmedPrice] = useState("");
  const [priceConfirmedWithCustomer, setPriceConfirmedWithCustomer] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(booking.confirmedDate || "");
  const [rescheduleTime, setRescheduleTime] = useState(booking.confirmedStart || "");
  const [confirmedDate, setConfirmedDate] = useState(booking.confirmedDate || booking.preferredDate);
  const [confirmedTime, setConfirmedTime] = useState(booking.confirmedStart || booking.preferredTime);
  const dateTime = (date: string, time: string) => date + " at " + time;
  const phoneDigits = (booking.customer.phone || "").replace(/\D/g, "");
  const whatsappNumber = phoneDigits.startsWith("0") ? `27${phoneDigits.slice(1)}` : phoneDigits;
  const whatsappUrl = whatsappNumber.length >= 9 ? `https://wa.me/${whatsappNumber}` : null;
  const statusColor = booking.status === "APPROVED" || booking.status === "COMPLETED"
    ? "border-success/25 bg-success/10 text-success"
    : booking.status === "PENDING"
      ? "border-warning/25 bg-warning/10 text-warning"
      : booking.status === "REJECTED" || booking.status === "CANCELLED"
        ? "border-error/25 bg-error/10 text-error"
        : "border-deep-berry/20 bg-pale-blush text-deep-berry";
  return <details className="overflow-hidden rounded-2xl border border-pale-blush bg-surface shadow-sm">
    <summary className="grid cursor-pointer gap-2 bg-surface p-4 text-sm transition-colors hover:bg-soft-pink md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center"><b className="text-deep-berry">{booking.reference}</b><span>{booking.customer.name}</span><span>{booking.service.name}</span><span>{booking.confirmedDate ? dateTime(booking.confirmedDate, booking.confirmedStart || "") : dateTime(booking.preferredDate, booking.preferredTime)}</span><span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusColor}`}>{booking.status}</span></summary>
    <div className="border-t border-soft-border p-5 text-sm"><div className="grid gap-6 md:grid-cols-2">
      <section><h2 className="mb-2 font-semibold">Customer</h2><p>{booking.customer.name}</p>{booking.customer.email && <p><a className="underline" href={"mailto:" + booking.customer.email}>{booking.customer.email}</a></p>}{booking.customer.phone && <p><a className="underline" href={"tel:" + booking.customer.phone}>{booking.customer.phone}</a></p>}{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 bg-[#246b46] px-4 py-2.5 text-sm font-semibold text-silver transition-colors hover:bg-[#1b5537] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"><FaWhatsapp aria-hidden="true" size={18}/>Text them on WhatsApp</a>}<h3 className="mb-2 mt-5 font-semibold">Additional notes</h3><p className="whitespace-pre-wrap leading-6">{booking.description || "No additional notes."}</p></section>
      <section><h2 className="mb-2 font-semibold">Service details at request time</h2><p>{booking.service.name} · {booking.service.category || "Nail care"}</p>{booking.service.components?.map((component, index) => <p key={component.name + index} className="mt-1 text-xs text-dark-text/70">Includes {component.name}{typeof component.price === "number" ? ` · R${component.price}` : " · price to confirm"}</p>)}<p className="mt-2 font-medium">{booking.priceNeedsConfirmation ? "Price needs confirmation with customer" : typeof booking.totalPrice === "number" ? `Total · R${booking.totalPrice}` : booking.service.priceLabel || (booking.service.priceConfirmed && typeof booking.service.price === "number" ? `R${booking.service.price}` : "Price not set")}</p>{booking.extras?.map((extra, index) => <p key={extra.name + index} className="mt-1 text-xs text-dark-text/70">{extra.name}{extra.componentName ? ` · ${extra.componentName}` : ""} · {extra.quantity} × R{extra.unitPrice} = R{extra.subtotal}</p>)}{booking.service.description && <p className="mt-2">{booking.service.description}</p>}{booking.service.fullDescription && <p className="mt-2 whitespace-pre-wrap">{booking.service.fullDescription}</p>}<h3 className="mb-2 mt-5 font-semibold">Appointment and history</h3><p>Requested: {dateTime(booking.preferredDate, booking.preferredTime)}</p>{booking.confirmedDate && <p>Approved: {dateTime(booking.confirmedDate, booking.confirmedStart || "")}–{booking.confirmedEnd}</p>}{booking.rejectionReason && <p className="mt-2">Reason: {booking.rejectionReason}</p>}<ul className="mt-3 space-y-1 text-xs text-dark-text/70">{booking.history?.map((item, index) => <li key={item.status + "-" + index}>{item.status} · {new Date(item.at).toLocaleString("en-ZA", { timeZone: businessProfile.timezone })} · {item.by}{item.note ? " · " + item.note : ""}</li>)}</ul></section>
    </div>
    {booking.notifications?.length ? <section className="mt-5 border-t border-soft-border pt-4"><h3 className="font-semibold">Email history</h3><ul className="mt-2 space-y-2 text-xs">{booking.notifications.map((notice) => <li key={notice._id} className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{notice.type.replaceAll("_", " ")} · {notice.status} · {notice.recipient || "No recipient"} · {notice.attemptCount} attempt(s)</span>{notice.lastFailure && <span className="text-error">{notice.lastFailure}</span>}{notice.status === "FAILED" && <button onClick={() => onAction({ action: "retry-email", notificationId: notice._id })} className="underline">Retry email</button>}</li>)}</ul></section> : null}
    {booking.status === "PENDING" && <div className="mt-5 flex flex-col gap-3 border-t border-soft-border pt-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Approved date<input type="date" value={confirmedDate} onChange={(event) => setConfirmedDate(event.target.value)} className={input + " mt-1"}/></label><label className="text-xs">Approved start time<input type="time" value={confirmedTime} onChange={(event) => setConfirmedTime(event.target.value)} className={input + " mt-1"}/></label></div>{booking.priceNeedsConfirmation && <div className="grid gap-3 border-l-2 border-error bg-soft-pink/50 p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs">Agreed total price (R)<input type="number" min={1} step={1} value={confirmedPrice} onChange={(event) => setConfirmedPrice(event.target.value)} className={input + " mt-1"}/></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={priceConfirmedWithCustomer} onChange={(event) => setPriceConfirmedWithCustomer(event.target.checked)}/> I confirmed this price with the customer</label></div>}<div className="flex flex-wrap gap-2"><button onClick={() => onAction({ action: "approve", date: confirmedDate, time: confirmedTime, ...(booking.priceNeedsConfirmation ? { confirmedPrice, priceConfirmedWithCustomer } : {}) })} className="bg-strong-pink px-4 py-2 text-charcoal">Approve at selected time</button><input aria-label="Optional rejection reason" placeholder="Optional rejection reason" value={reason} onChange={(event) => setReason(event.target.value)} className={input + " max-w-xs"}/><button onClick={() => onAction({ action: "reject", reason })} className="border border-soft-border px-4 py-2">Reject request</button><button onClick={() => onAction({ action: "cancel" })} className="border border-soft-border px-4 py-2">Cancel request</button></div></div>}
    {booking.status === "APPROVED" && <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-soft-border pt-4"><label className="text-xs">New date<input type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} className={input}/></label><label className="text-xs">New time<input type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} className={input}/></label><button onClick={() => onAction({ action: "reschedule", date: rescheduleDate, time: rescheduleTime })} className="border border-soft-border px-4 py-2">Reschedule</button><button onClick={() => onAction({ action: "complete" })} className="border border-soft-border px-4 py-2">Mark completed</button><button onClick={() => onAction({ action: "cancel" })} className="border border-soft-border px-4 py-2">Cancel appointment</button></div>}
    </div>
  </details>;
}
function BookingCalendar({ date, onDate }: { date: string; onDate: (date: string) => void }) {
  const chosen = date || new Date().toLocaleDateString("en-CA", { timeZone: businessProfile.timezone });
  const [bookings, setBookings] = useState<Booking[]>([]); const [loadedDate, setLoadedDate] = useState("");
  useEffect(() => { void fetch(`/api/admin/bookings?date=${chosen}&page=1`).then(responseData).then((data) => { setBookings(data.bookings ?? []); setLoadedDate(chosen); }).catch(() => { setBookings([]); setLoadedDate(chosen); }); }, [chosen]);
  const confirmed = bookings.filter((booking) => booking.status === "APPROVED" && booking.confirmedDate === chosen).sort((a, b) => (a.confirmedStart || "").localeCompare(b.confirmedStart || ""));
  const pending = bookings.filter((booking) => booking.status === "PENDING" && booking.preferredDate === chosen);
  return <section className="border border-soft-border bg-surface p-5 md:p-7"><label className="mb-6 block max-w-xs text-sm font-medium">Appointments on<input type="date" value={chosen} onChange={(event) => onDate(event.target.value)} className={`${input} mt-2`}/></label>{loadedDate !== chosen ? <p className="text-sm text-dark-text/70">Loading appointments…</p> : <div className="grid gap-8 md:grid-cols-2"><div><h2 className="font-display text-3xl">Confirmed appointments</h2>{confirmed.length ? <ul className="mt-4 divide-y divide-soft-border">{confirmed.map((booking) => <li key={booking._id} className="py-3 text-sm"><b>{booking.confirmedStart}–{booking.confirmedEnd}</b> · {booking.customer.name} · {booking.service.name}<span className="block text-xs text-dark-text/70">{booking.reference}</span></li>)}</ul> : <p className="mt-4 text-sm text-dark-text/70">No confirmed appointments for this date.</p>}</div><div><h2 className="font-display text-3xl">Pending requests</h2>{pending.length ? <ul className="mt-4 divide-y divide-soft-border">{pending.map((booking) => <li key={booking._id} className="py-3 text-sm"><b>{booking.preferredTime}</b> · {booking.customer.name} · {booking.service.name}<span className="block text-xs text-dark-text/70">{booking.reference} · request pending, time held for review</span></li>)}</ul> : <p className="mt-4 text-sm text-dark-text/70">No pending requests for this date.</p>}</div></div>}</section>;
}

function AvailabilityAndServices({ onMessage, onError }: { onMessage: (message: string) => void; onError: (message: string) => void }) {
  const [weekly, setWeekly] = useState(blankWeekly());
  const [schedulePersisted, setSchedulePersisted] = useState(false);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [legacyOpeningRules, setLegacyOpeningRules] = useState<{ date: string; periods: Period[] }[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [breaks, setBreaks] = useState<TimeBlock[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(30); const [bufferMinutes, setBufferMinutes] = useState(0);
  const [referenceDate, setReferenceDate] = useState(""); const [openTime, setOpenTime] = useState("09:00"); const [closeTime, setCloseTime] = useState("17:30"); const [closedDate, setClosedDate] = useState("");
  const [blockDate, setBlockDate] = useState(""); const [blockStart, setBlockStart] = useState(""); const [blockEnd, setBlockEnd] = useState("");
  const [services, setServices] = useState<AdminService[]>([]); const [servicesLoaded, setServicesLoaded] = useState(false);
  const weekday = referenceDate ? new Date(referenceDate + "T12:00:00Z").getUTCDay() : -1;

  useEffect(() => {
    void fetch("/api/admin/availability").then(responseData).then(({ settings, legacyOpeningRules: legacy = [] }) => {
      if (settings) {
        setSchedulePersisted(true);
        setWeekly((settings.weekly || blankWeekly()).map((day: Record<string, unknown>) => ({ weekday: Number(day.weekday), enabled: Boolean(day.enabled), periods: Array.isArray(day.periods) && day.periods.length ? day.periods : day.open && day.close ? [{ open: String(day.open), close: String(day.close) }] : [blankPeriod()] })));
        const legacyClosed = (settings.exceptions || []).filter((item: Record<string, unknown>) => !item.enabled).map((item: Record<string, unknown>) => String(item.date));
        setClosedDates([...new Set([...(settings.blockedDates || []), ...legacyClosed])]);
        setBlockedPeriods(settings.blockedPeriods || []);
        setBreaks(settings.breaks || (settings.breakStart && settings.breakEnd ? [{ start: settings.breakStart, end: settings.breakEnd }] : []));
        setSlotMinutes(settings.slotMinutes || 30); setBufferMinutes(settings.bufferMinutes || 0);
      } else setSchedulePersisted(false);
      setLegacyOpeningRules(legacy);
    }).catch((reason: Error) => onError(reason.message));
    void fetch("/api/admin/services").then(responseData).then(({ services: rows }) => setServices(rows)).catch((reason: Error) => onError(reason.message)).finally(() => setServicesLoaded(true));
  }, [onError]);

  async function saveAvailability(nextWeekly = weekly, nextClosed = closedDates) {
    onError("");
    try {
      await responseData(await fetch("/api/admin/availability", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ weekly: nextWeekly, blockedDates: nextClosed, blockedPeriods, breaks, slotMinutes, bufferMinutes }) }));
      setWeekly(nextWeekly); setClosedDates(nextClosed); setSchedulePersisted(true); onMessage("Availability saved.");
    } catch (reason) { onError(reason instanceof Error ? reason.message : "Availability could not be saved."); }
  }
  function dateForWeekday(target: number) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: businessProfile.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const current = new Date(today + "T12:00:00Z"); current.setUTCDate(current.getUTCDate() + ((target - current.getUTCDay() + 7) % 7));
    return current.toISOString().slice(0, 10);
  }
  async function saveRecurringDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (weekday < 0 || !openTime || !closeTime || closeTime <= openTime) { onError("Choose a date and a valid opening and closing time."); return; }
    const next = weekly.map((item) => item.weekday === weekday ? { weekday, enabled: true, periods: [{ open: openTime, close: closeTime }] } : item);
    await saveAvailability(next);
  }
  function editDay(day: Day) {
    setReferenceDate(dateForWeekday(day.weekday));
    const existing = day.periods || [];
    setOpenTime(existing[0]?.open || "09:00");
    setCloseTime(existing[existing.length - 1]?.close || "17:30");
  }
  async function removeDay(day: Day) {
    const next = weekly.map((item) => item.weekday === day.weekday ? { ...item, enabled: false, periods: [blankPeriod()] } : item);
    await saveAvailability(next);
  }
  async function toggleClosedDate(date: string, remove = false) {
    const next = remove ? closedDates.filter((item) => item !== date) : [...new Set([...closedDates, date])];
    await saveAvailability(weekly, next);
  }

  return <div className="grid items-start gap-8 xl:grid-cols-[1fr_1fr]">
    <div className="space-y-6">
      <section className="border border-soft-border bg-surface p-5 md:p-7">
        <h2 className="font-display text-4xl">Regular weekly availability</h2>
        <p className="mb-5 mt-2 text-sm text-dark-text/70">Select a reference date to set the hours that repeat every week for that weekday. All times use {businessProfile.timezone}.</p>
        {!schedulePersisted && <p className="mb-4 border-l-2 border-brand-pink bg-soft-pink/60 p-3 text-sm">Default hours are shown. Save the schedule to store them in the database.</p>}
        <div className="space-y-2">{weekly.filter((day) => day.enabled).sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7)).map((day) => {
          const periods = day.periods || [];
          const label = periods.map((period) => period.open + "–" + period.close).join(", ");
          return <div key={day.weekday} className="flex flex-wrap items-center justify-between gap-3 border-b border-soft-border py-3 text-sm"><span><b>{dayNames[day.weekday]}</b><span className="ml-3 text-dark-text/70">{label}</span>{periods.length > 1 && <span className="ml-2 text-xs text-error">Multiple periods · review this schedule</span>}</span><span className="flex gap-3"><button type="button" onClick={() => editDay(day)} className="underline">Edit</button><button type="button" onClick={() => void removeDay(day)} className="underline">Remove</button></span></div>;
        })}{!weekly.some((day) => day.enabled) && <p className="py-3 text-sm text-dark-text/70">No weekly hours saved yet.</p>}</div>
        <form onSubmit={saveRecurringDay} className="mt-6 border-t border-soft-border pt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs">Reference date<input type="date" required value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} className={input + " mt-1"}/></label>
            <label className="text-xs">Opens<input type="time" required value={openTime} onChange={(event) => setOpenTime(event.target.value)} className={input + " mt-1"}/></label>
            <label className="text-xs">Closes<input type="time" required value={closeTime} onChange={(event) => setCloseTime(event.target.value)} className={input + " mt-1"}/></label>
          </div>
          {weekday >= 0 && <p className="mt-3 text-sm text-deep-berry">This schedule will repeat every {dayNames[weekday]}.</p>}
          <button type="submit" className="mt-4 bg-strong-pink px-4 py-2.5 text-sm text-charcoal">Save weekly schedule</button>
        </form>
      </section>

      <section className="border border-soft-border bg-surface p-5 md:p-7">
        <h2 className="font-display text-4xl">Closed dates</h2><p className="mt-2 text-sm text-dark-text/70">Choose specific dates when the studio will not operate. The normal weekly hours return the following week.</p>
        <div className="mt-4 flex gap-2"><input aria-label="Date the studio is closed" type="date" value={closedDate} onChange={(event) => setClosedDate(event.target.value)} className={input}/><button type="button" onClick={() => { if (closedDate) void toggleClosedDate(closedDate).then(() => setClosedDate("")); }} className="shrink-0 border border-soft-border px-3 text-sm">Add closed date</button></div>
        <ul className="mt-3 space-y-2 text-sm">{closedDates.sort().map((date) => <li key={date} className="flex items-center justify-between border-b border-soft-border py-2">{date}<button type="button" onClick={() => void toggleClosedDate(date, true)} className="underline">Remove</button></li>)}</ul>
        {!closedDates.length && <p className="mt-3 text-xs text-dark-text/70">No closed dates added.</p>}
      </section>

      {legacyOpeningRules.length > 0 && <aside className="border-l-4 border-error bg-surface p-4 text-sm"><b>Review older opening schedules</b><p className="mt-1">These one-time opening rules are saved for review and do not create bookable hours. Recreate the relevant weekday as a recurring schedule if it should continue.</p><ul className="mt-2 list-inside list-disc">{legacyOpeningRules.map((rule) => <li key={rule.date}>{rule.date}: {rule.periods.map((period) => period.open + "–" + period.close).join(", ") || "hours not recorded"}</li>)}</ul></aside>}

      <section className="border border-soft-border bg-surface p-5 md:p-7">
        <h2 className="font-display text-3xl">Scheduling restrictions</h2><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Time between offered appointments (minutes)<input type="number" min={5} max={480} step={5} value={slotMinutes} onChange={(event) => setSlotMinutes(Number(event.target.value))} className={input + " mt-2"}/></label><label className="text-sm">Buffer between visits (minutes)<input type="number" min={0} max={240} step={5} value={bufferMinutes} onChange={(event) => setBufferMinutes(Number(event.target.value))} className={input + " mt-2"}/></label></div>
        <PeriodEditor heading="Break periods" periods={breaks} onChange={setBreaks}/>
        <div className="mt-5 border-t border-soft-border pt-4"><h3 className="font-semibold">Blocked appointment periods</h3><div className="mt-3 grid gap-2 sm:grid-cols-3"><input aria-label="Blocked period date" type="date" value={blockDate} onChange={(event) => setBlockDate(event.target.value)} className={input}/><input aria-label="Blocked period starts" type="time" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} className={input}/><input aria-label="Blocked period ends" type="time" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} className={input}/></div><button type="button" onClick={() => { if (blockDate && blockStart && blockEnd) { setBlockedPeriods([...blockedPeriods, { date: blockDate, start: blockStart, end: blockEnd }]); setBlockStart(""); setBlockEnd(""); } }} className="mt-2 border border-soft-border px-3 py-2 text-xs">Add blocked period</button><ul className="mt-2 space-y-1 text-xs">{blockedPeriods.map((item, index) => <li key={item.date + item.start + index} className="flex gap-2">{item.date} · {item.start}–{item.end}<button type="button" onClick={() => setBlockedPeriods(blockedPeriods.filter((_, i) => i !== index))} className="underline">Remove</button></li>)}</ul></div>
        <button type="button" onClick={() => void saveAvailability()} className="mt-6 bg-strong-pink px-5 py-3 text-sm text-charcoal">Save scheduling settings</button>
      </section>
    </div>
    <ServiceEditor services={services} loaded={servicesLoaded} setServices={setServices} onMessage={onMessage} onError={onError}/>
  </div>;
}
function PeriodEditor({ heading, periods, onChange }: { heading: string; periods: TimeBlock[]; onChange: (periods: TimeBlock[]) => void }) {
  return <div className="mt-5 border-t border-soft-border pt-5"><h3 className="font-semibold">{heading}</h3><div className="mt-3 space-y-2">{periods.map((period, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><label className="text-xs">Starts<input type="time" value={period.start} onChange={(event) => onChange(periods.map((item, i) => i === index ? { ...item, start: event.target.value } : item))} className={`${input} mt-1`}/></label><label className="text-xs">Ends<input type="time" value={period.end} onChange={(event) => onChange(periods.map((item, i) => i === index ? { ...item, end: event.target.value } : item))} className={`${input} mt-1`}/></label><button type="button" onClick={() => onChange(periods.filter((_, i) => i !== index))} className="mt-5 px-2 text-xs underline">Remove</button></div>)}</div><button type="button" onClick={() => onChange([...periods, { start: "13:00", end: "14:00" }])} className="mt-2 text-xs font-semibold text-deep-berry underline">Add {heading.toLowerCase()}</button></div>;
}

function ServiceEditor({ services, loaded, setServices, onMessage, onError }: { services: AdminService[]; loaded: boolean; setServices: (services: AdminService[]) => void; onMessage: (message: string) => void; onError: (message: string) => void }) {
  const [draft, setDraft] = useState(blankService()); const [creating, setCreating] = useState(false); const [uploadingId, setUploadingId] = useState("");
  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreating(true); onError("");
    try { const data = await responseData(await fetch("/api/admin/services", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) })); setServices([...services, data.service].sort((a, b) => a.displayOrder - b.displayOrder)); setDraft(blankService()); onMessage("Service created."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Service could not be created."); }
    finally { setCreating(false); }
  }
  async function saveService(service: AdminService) {
    onError("");
    try { const { _id, ...fields } = service; const data = await responseData(await fetch("/api/admin/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...fields, id: _id }) })); setServices(services.map((item) => item._id === service._id ? data.service : item)); onMessage("Service saved."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Service could not be saved."); }
  }
  async function removeService(service: AdminService) {
    if (!window.confirm(`Remove “${service.name}”? Services with booking history will be archived.`)) return;
    onError("");
    try { const data = await responseData(await fetch(`/api/admin/services?id=${service._id}`, { method: "DELETE" })); setServices(data.deleted ? services.filter((item) => item._id !== service._id) : services.map((item) => item._id === service._id ? data.service : item)); onMessage(data.archived ? "Service archived to preserve booking history." : "Service deleted."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Service could not be removed."); }
  }
  async function uploadImage(service: AdminService, file?: File) {
    if (!file) return; setUploadingId(service._id); onError("");
    const form = new FormData(); form.set("file", file);
    try { await responseData(await fetch(`/api/admin/services/${service._id}/image`, { method: "POST", body: form })); const data = await responseData(await fetch("/api/admin/services")); setServices(data.services); onMessage("Service image updated."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Image could not be uploaded."); }
    finally { setUploadingId(""); }
  }
  async function removeImage(service: AdminService) {
    try { await responseData(await fetch(`/api/admin/services/${service._id}/image`, { method: "DELETE" })); const data = await responseData(await fetch("/api/admin/services")); setServices(data.services); onMessage("Service image removed."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Image could not be removed."); }
  }
  const edit = (id: string, patch: Partial<AdminService>) => setServices(services.map((item) => item._id === id ? { ...item, ...patch } : item));

  return <section className="space-y-5"><form onSubmit={createService} className="border border-soft-border bg-surface p-5 md:p-7"><h2 className="font-display text-4xl">Add a service</h2><p className="mb-5 mt-2 text-sm text-dark-text/70">Set the details customers should see before booking.</p><ServiceFields value={draft} onChange={(patch) => setDraft({ ...draft, ...patch })}/><button disabled={creating} className="mt-5 bg-strong-pink px-5 py-3 text-sm text-charcoal disabled:opacity-50">{creating ? "Creating…" : "Create service"}</button></form>
    <section className="border border-soft-border bg-surface p-5 md:p-7"><h2 className="font-display text-4xl">Manage services</h2><p className="mb-5 mt-2 text-sm text-dark-text/70">Each booking keeps its original price and service details after catalogue changes.</p>{loaded && !services.length && <p className="text-sm text-dark-text/70">No services yet.</p>}<div className="space-y-5">{services.map((service) => <article key={service._id} className="border-t border-soft-border pt-5"><div className="mb-4 flex items-center justify-between gap-4"><h3 className="font-display text-2xl">{service.name}</h3><span className={`text-xs ${service.active ? "font-semibold text-success" : "text-dark-text/70"}`}>{service.active ? "Active" : "Archived"}</span></div><div className="mb-4 flex flex-wrap items-center gap-4"><div className="relative size-24 overflow-hidden bg-soft-pink"><Image src={service.image || "/images/hero.jpg"} alt={`${service.name} service`} fill sizes="96px" unoptimized className="object-cover"/></div><label className="cursor-pointer border border-soft-border px-4 py-2 text-sm">{uploadingId === service._id ? "Uploading…" : "Upload or replace image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingId === service._id} onChange={(event) => void uploadImage(service, event.target.files?.[0])} className="sr-only"/></label>{service.imagePublicId && <button type="button" onClick={() => void removeImage(service)} className="text-sm underline">Remove image</button>}</div><ServiceFields value={service} onChange={(patch) => edit(service._id, patch)}/><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void saveService(service)} className="bg-strong-pink px-4 py-2 text-sm text-charcoal">Save changes</button><button onClick={() => void saveService({ ...service, active: !service.active })} className="border border-soft-border px-4 py-2 text-sm">{service.active ? "Deactivate" : "Reactivate"}</button><button onClick={() => void removeService(service)} className="border border-soft-border px-4 py-2 text-sm">Delete or archive</button></div></article>)}</div></section>
    <PackageEditor services={services.filter((item) => item.active)} onMessage={onMessage} onError={onError}/>
  </section>;
}

function ServiceFields({ value, onChange }: { value: Partial<AdminService>; onChange: (patch: Partial<AdminService>) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs">Service name<input required minLength={2} maxLength={100} value={value.name || ""} onChange={(event) => onChange({ name: event.target.value })} className={input + " mt-1"}/></label>
    <label className="text-xs">Category<input maxLength={80} value={value.category || ""} onChange={(event) => onChange({ category: event.target.value })} className={input + " mt-1"}/></label>
    <label className="text-xs">Display order<input type="number" min={0} max={10000} value={value.displayOrder ?? 0} onChange={(event) => onChange({ displayOrder: Number(event.target.value) })} className={input + " mt-1"}/></label>
    <label className="text-xs sm:col-span-2">Short description<textarea maxLength={500} rows={2} value={value.description || ""} onChange={(event) => onChange({ description: event.target.value })} className="mt-1 w-full rounded-lg border border-soft-border bg-surface p-3 text-sm"/></label>
    <label className="text-xs sm:col-span-2">Full description<textarea maxLength={3000} rows={4} value={value.fullDescription || ""} onChange={(event) => onChange({ fullDescription: event.target.value })} className="mt-1 w-full rounded-lg border border-soft-border bg-surface p-3 text-sm"/></label>
    <label className="text-xs">Price (R)<input type="number" min={1} step={1} value={value.price ?? ""} onChange={(event) => onChange({ price: event.target.value === "" ? undefined : Number(event.target.value) })} className={input + " mt-1"}/></label>
    <label className="flex items-center gap-2 self-end pb-3 text-xs"><input type="checkbox" checked={value.priceConfirmed === true} disabled={value.price == null} onChange={(event) => onChange({ priceConfirmed: event.target.checked })}/> Price confirmed for customers</label>
    <p className="text-[11px] text-dark-text/70 sm:col-span-2">Leave the price unconfirmed until the business approves it. Customers will see that the final price needs studio confirmation.</p>
    <div className="border-t border-soft-border pt-4 sm:col-span-2"><h3 className="font-semibold">Optional extras</h3><p className="mt-1 text-xs text-dark-text/70">Extras configured here are available only with this service. Prices are per nail or per design as selected.</p><div className="mt-3 space-y-3">{(value.extras ?? []).map((extra, index) => <div key={extra.key} className="grid gap-2 rounded-lg bg-soft-pink/50 p-3 sm:grid-cols-[1fr_1fr_120px_150px_auto] sm:items-end"><label className="text-[11px]">Name<input value={extra.name} maxLength={100} onChange={(event) => onChange({ extras: value.extras?.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} className={input + " mt-1"}/></label><label className="text-[11px]">Key<input value={extra.key} maxLength={80} onChange={(event) => onChange({ extras: value.extras?.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item) })} className={input + " mt-1"}/></label><label className="text-[11px]">Price (R)<input type="number" min={1} step={1} value={extra.unitPrice} onChange={(event) => onChange({ extras: value.extras?.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: Number(event.target.value) } : item) })} className={input + " mt-1"}/></label><label className="text-[11px]">Charge<select value={extra.method} onChange={(event) => onChange({ extras: value.extras?.map((item, itemIndex) => itemIndex === index ? { ...item, method: event.target.value as AdminExtra["method"] } : item) })} className={input + " mt-1"}><option value="PER_NAIL">Per nail</option><option value="PER_DESIGN">Per design</option></select></label><button type="button" aria-label={`Remove ${extra.name}`} onClick={() => onChange({ extras: value.extras?.filter((_, itemIndex) => itemIndex !== index) })} className="px-2 py-2 text-sm underline">Remove</button></div>)}</div><button type="button" onClick={() => onChange({ extras: [...(value.extras ?? []), { key: `extra-${crypto.randomUUID().slice(0, 8)}`, name: "", unitPrice: 1, method: "PER_NAIL" }] })} className="mt-3 text-xs font-semibold text-deep-berry underline">Add optional extra</button></div>
  </div>;
}

function PackageEditor({ services, onMessage, onError }: { services: AdminService[]; onMessage: (message: string) => void; onError: (message: string) => void }) {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", serviceIds: [] as string[], displayOrder: 0, active: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => { void fetch("/api/admin/packages").then(responseData).then((data) => setPackages(data.packages ?? [])).catch((reason: Error) => onError(reason.message)).finally(() => setLoaded(true)); }, [onError]);
  async function savePackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (draft.serviceIds.length < 2) { onError("Select at least two services for the package."); return; }
    setSaving(true); onError("");
    try { const data = await responseData(await fetch("/api/admin/packages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) })); setPackages([...packages, data.package]); setDraft({ name: "", description: "", serviceIds: [], displayOrder: packages.length * 10, active: true }); onMessage("Package created. Its price is calculated from current component prices."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Package could not be created."); }
    finally { setSaving(false); }
  }
  async function updatePackage(item: AdminPackage, patch: Partial<AdminPackage>) {
    const { _id, ...fields } = item;
    try { const data = await responseData(await fetch("/api/admin/packages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...fields, ...patch, id: _id }) })); setPackages(packages.map((existing) => existing._id === item._id ? data.package : existing)); onMessage("Package saved."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Package could not be saved."); }
  }
  async function removePackage(item: AdminPackage) {
    if (!window.confirm(`Remove “${item.name}”? Packages with booking history will be archived.`)) return;
    try { const data = await responseData(await fetch(`/api/admin/packages?id=${item._id}`, { method: "DELETE" })); setPackages(data.deleted ? packages.filter((entry) => entry._id !== item._id) : packages.map((entry) => entry._id === item._id ? data.package : entry)); onMessage(data.archived ? "Package archived to preserve booking history." : "Package removed."); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "Package could not be removed."); }
  }
  const serviceChecks = (ids: string[], setIds: (ids: string[]) => void) => <div className="grid gap-2 sm:grid-cols-2">{services.map((service) => <label key={service._id} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={ids.includes(service._id)} onChange={(event) => setIds(event.target.checked ? [...ids, service._id] : ids.filter((id) => id !== service._id))}/><span>{service.name} · {service.priceConfirmed && service.price != null ? `R${service.price}` : "price to be confirmed"}</span></label>)}</div>;
  const fieldSet = (item: { name: string; description: string; serviceIds: string[]; displayOrder: number }, change: (patch: Partial<typeof item>) => void) => <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Package name<input required minLength={3} maxLength={120} value={item.name} onChange={(event) => change({ name: event.target.value })} className={input + " mt-1"}/></label><label className="text-xs">Display order<input type="number" min={0} max={10000} value={item.displayOrder} onChange={(event) => change({ displayOrder: Number(event.target.value) })} className={input + " mt-1"}/></label><label className="text-xs sm:col-span-2">Description<textarea maxLength={1000} value={item.description} onChange={(event) => change({ description: event.target.value })} className="mt-1 w-full rounded-lg border border-soft-border bg-surface p-3 text-sm"/></label><div className="text-xs sm:col-span-2"><p className="mb-2 font-medium">Included services</p>{serviceChecks(item.serviceIds, (serviceIds) => change({ serviceIds }))}</div><p className="text-[11px] text-dark-text/70">Package price is always the sum of its included services. No discount is applied.</p></div>;
  return <section className="border border-soft-border bg-surface p-5 md:p-7"><h2 className="font-display text-4xl">Combination packages</h2><p className="mb-5 mt-2 text-sm text-dark-text/70">Package prices are calculated from the current prices of their included services. No discounts are applied.</p><form onSubmit={savePackage} className="border-b border-soft-border pb-6">{fieldSet(draft, (patch) => setDraft({ ...draft, ...patch }))}<button disabled={saving} className="mt-4 rounded-xl bg-strong-pink px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-raised-surface hover:text-silver disabled:opacity-50">{saving ? "Saving…" : "Add package"}</button></form>{loaded && !packages.length && <p className="py-4 text-sm text-dark-text/70">No packages have been configured.</p>}<div className="divide-y divide-soft-border">{packages.map((item) => <details key={item._id} className="py-4"><summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-deep-berry"><span>{item.name}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] ${item.active ? "border-success/25 bg-success/10 text-success" : "border-soft-border bg-pale-blush text-dark-text/70"}`}>{item.active ? "Active" : "Archived"}</span></summary><div className="pt-4">{fieldSet(item, (patch) => setPackages(packages.map((existing) => existing._id === item._id ? { ...existing, ...patch } : existing)))}<div className="mt-4 flex gap-2"><button type="button" onClick={() => void updatePackage(item, item)} className="rounded-xl bg-strong-pink px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-raised-surface hover:text-silver">Save changes</button><button type="button" onClick={() => void updatePackage(item, { active: !item.active })} className="rounded-xl border border-soft-border px-4 py-2 text-sm transition-colors hover:bg-pale-blush">{item.active ? "Deactivate" : "Reactivate"}</button><button type="button" onClick={() => void removePackage(item)} className="rounded-xl border border-soft-border px-4 py-2 text-sm transition-colors hover:bg-pale-blush">Delete or archive</button></div></div></details>)}</div></section>;
}
