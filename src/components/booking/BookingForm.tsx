"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import { studioContact } from "@/lib/data";
import { todayInSalon } from "@/lib/timezone";

type Extra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN"; durationMinutes?: number; componentName?: string };
type CatalogueItem = { _id: string; name: string; description: string; fullDescription?: string; image: string; category: string; price?: number; priceConfirmed: boolean; durationMinutes?: number; isPackage?: boolean; components?: { name: string }[]; extras?: Extra[] };
type BookingToast = { id: number; type: "success" | "error"; message: string };
const input = "h-12 w-full rounded-xl border border-taupe bg-white px-3.5 text-ink";
const selectionValue = (item?: CatalogueItem) => item ? `${item.isPackage ? "package" : "service"}:${item._id}` : "";
const methodLabel = (extra: Extra) => extra.method === "PER_NAIL" ? "per nail" : "per design";

function BookingImage({ item }: { item: CatalogueItem }) {
  const [src, setSrc] = useState(item.image || "/images/hero.jpg");
  return <div className="relative aspect-[4/3] overflow-hidden bg-sand"><Image src={src} alt={item.name} fill sizes="(max-width: 640px) 100vw, 190px" className="object-cover" onError={() => setSrc("/images/hero.jpg")}/></div>;
}

export default function BookingForm() {
  const query = useSearchParams();
  const [services, setServices] = useState<CatalogueItem[]>([]);
  const [packages, setPackages] = useState<CatalogueItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [selection, setSelection] = useState(() => query.get("package") ? `package:${query.get("package")}` : query.get("service") ? `service:${query.get("service")}` : "");
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose a date to see available times.");
  const [time, setTime] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState<BookingToast | null>(null);
  const [busy, setBusy] = useState(false);
  const idempotencyKey = useRef("");
  const item = [...services, ...packages].find((entry) => selectionValue(entry) === selection);
  const itemId = item?._id;
  const itemIsPackage = item?.isPackage;
  const chosenExtras = useMemo(() => Object.entries(extraQuantities).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => ({ key, quantity })), [extraQuantities]);
  const extrasQuery = JSON.stringify(chosenExtras);
  const extraTotal = (item?.extras ?? []).filter((extra) => (extraQuantities[extra.key] ?? 0) > 0).reduce((total, extra) => total + extra.unitPrice * (extraQuantities[extra.key] ?? 0), 0);
  const total = item?.priceConfirmed && typeof item.price === "number" ? item.price + extraTotal : undefined;

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    fetch("/api/services").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Services are temporarily unavailable.");
      setServices(data.services ?? []); setPackages(data.packages ?? []);
    }).catch((error: Error) => setServiceError(error.message)).finally(() => setItemsLoaded(true));
  }, []);

  useEffect(() => {
    if (!date || !itemId) return;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    const params = new URLSearchParams({ date, [itemIsPackage ? "packageId" : "serviceId"]: itemId, extras: extrasQuery });
    fetch("/api/availability?" + params.toString(), { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Availability could not be loaded."); setTimes(data.times ?? []); setAvailabilityMessage(data.error || (data.times?.length ? "Choose one of the available times." : "There are no available appointments on this date.")); })
      .catch((error: unknown) => { if (error instanceof DOMException && error.name === "AbortError") { if (timedOut) { setAvailabilityMessage("Availability took too long to load. Please choose the date again."); setAvailabilityLoading(false); } return; } setTimes([]); setAvailabilityMessage(error instanceof Error ? error.message : "Availability could not be loaded."); })
      .finally(() => { window.clearTimeout(timeout); if (!controller.signal.aborted) setAvailabilityLoading(false); });
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [date, itemId, itemIsPackage, extrasQuery]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !item) return;
    const formElement = event.currentTarget; setBusy(true); setSuccess(""); setToast(null);
    const form = new FormData(formElement);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const body = { name: form.get("name"), phone: form.get("phone"), email: form.get("email"), description: form.get("description"), date, time, extras: chosenExtras, ...(item.isPackage ? { packageId: item._id } : { serviceId: item._id }) };
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "We couldn’t send your request.");
      const message = result.priceNeedsConfirmation ? `Request ${result.reference} is saved for review. The studio will confirm the service price before approval.` : result.emailStatus === "FAILED" ? `Request ${result.reference} is saved and awaiting review. The studio’s email notification is delayed; your appointment is not confirmed yet.` : `Request ${result.reference} has been received and is awaiting review. Your appointment is not confirmed yet.`;
      setSuccess(message); setToast({ id: Date.now(), type: "success", message: "Request received · " + result.reference });
      formElement.reset(); setDate(""); setTime(""); setTimes([]); setAvailabilityLoading(false); setAvailabilityMessage("Choose a date to see available times."); setExtraQuantities({}); idempotencyKey.current = crypto.randomUUID();
    } catch (error) { setToast({ id: Date.now(), type: "error", message: error instanceof Error ? error.message : "We couldn’t send your request." }); }
    finally { setBusy(false); }
  }

  return <>
    {toast && <div key={toast.id} role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} className={cn("fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border bg-white px-5 py-4 shadow-xl", toast.type === "success" ? "border-olive/30" : "border-rose/40")}><span aria-hidden="true" className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold text-white", toast.type === "success" ? "bg-olive" : "bg-rose")}>{toast.type === "success" ? "✓" : "!"}</span><p className="flex-1 text-sm leading-6 text-ink">{toast.message}</p><button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)} className="grid h-8 w-8 place-items-center rounded-full text-xl text-ink/55 hover:bg-sand">×</button></div>}
    {success && <div role="status" className="mt-6 border-l-4 border-olive bg-sand/70 p-5 text-sm leading-6">{success}</div>}
    <form onSubmit={submit} className="grid items-start gap-8 pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="border-b border-line pb-8"><p className="mb-2 text-xs font-semibold text-gold">Your selection</p>
          <label className="block max-w-xl text-sm font-medium">Service or package<select required value={selection} onChange={(event) => { const nextSelection = event.target.value; const nextItem = [...services, ...packages].find((entry) => selectionValue(entry) === nextSelection); setSelection(nextSelection); setExtraQuantities({}); setTimes([]); setTime(""); setAvailabilityLoading(Boolean(date && nextItem?.durationMinutes)); setAvailabilityMessage(nextItem?.durationMinutes ? "Checking available times…" : "Choose a date to see available times."); }} className={input + " mt-2"}><option value="">Choose from the menu</option><optgroup label="Services">{services.map((entry) => <option key={entry._id} value={`service:${entry._id}`}>{entry.name} · {entry.priceConfirmed && entry.price != null ? `R${entry.price}` : "price to be confirmed"}</option>)}</optgroup><optgroup label="Combination packages">{packages.map((entry) => <option key={entry._id} value={`package:${entry._id}`}>{entry.name} · {entry.priceConfirmed && entry.price != null ? `R${entry.price}` : "price to be confirmed"}</option>)}</optgroup></select></label>
          {!item && <p className="mt-3 text-sm text-ink/65">{itemsLoaded ? serviceError || "Choose a service or package to continue." : "Loading the service menu…"}</p>}
          {item && <div className="mt-5 grid gap-5 sm:grid-cols-[190px_1fr]"><BookingImage item={item}/><div><h2 className="font-display text-4xl">{item.name}</h2><p className="mt-2 text-sm leading-6 text-ink/70">{item.description || item.fullDescription || "Selected treatment at Sbosh's Beauty Studio."}</p>{item.components?.length ? <p className="mt-2 text-xs text-ink/60">Includes {item.components.map((component) => component.name).join(" + ")}</p> : null}<p className="mt-4 text-sm font-semibold">{item.priceConfirmed && item.price != null ? `R${item.price}` : "Price to be confirmed by the studio"}</p><p className="mt-1 text-xs text-ink/55">{item.durationMinutes ? `${item.durationMinutes} minutes` : "Appointment length needs confirmation before booking"}</p></div></div>}
        </section>
        {item?.extras?.length ? <section className="border-b border-line pb-8"><p className="mb-2 text-xs font-semibold text-gold">Optional finish</p><h2 className="mb-4 font-display text-4xl">Add a little detail</h2><div className="divide-y divide-line">{item.extras.map((extra) => { const quantity = extraQuantities[extra.key] ?? 0; return <div key={extra.key} className="grid grid-cols-[minmax(0,1fr)_108px] items-center gap-4 py-3"><label htmlFor={`extra-${extra.key}`} className="text-sm">{extra.name}{extra.componentName && <span className="block text-xs text-ink/55">For {extra.componentName}</span>}<span className="mt-1 block text-xs text-ink/55">R{extra.unitPrice} {methodLabel(extra)}</span></label><input id={`extra-${extra.key}`} type="number" inputMode="numeric" min={0} max={10} step={1} value={quantity || ""} placeholder="0" aria-label={`${extra.name} quantity`} onChange={(event) => { const value = Number(event.target.value); setExtraQuantities((current) => ({ ...current, [extra.key]: event.target.value === "" || value === 0 ? 0 : value })); setTimes([]); setTime(""); setAvailabilityLoading(Boolean(date && item.durationMinutes)); setAvailabilityMessage("Checking available times…"); }} className={input}/></div>; })}</div><p className="mt-3 text-xs text-ink/55">Enter the number of nails or designs. Maximum 10 per extra.</p></section> : null}
        <section className="border-b border-line pb-8"><p className="mb-2 text-xs font-semibold text-gold">Choose your preference</p><h2 className="mb-5 font-display text-4xl">Date and available time</h2><label className="flex max-w-sm flex-col gap-2 text-sm font-medium">Appointment date<input type="date" required min={todayInSalon()} value={date} onChange={(event) => { const value = event.target.value; setDate(value); setTime(""); setTimes([]); setAvailabilityLoading(Boolean(value && item?.durationMinutes)); setAvailabilityMessage(value && item?.durationMinutes ? "Checking available times…" : "Choose a date to see available times."); }} className={input}/></label><fieldset className="mt-5" aria-busy={availabilityLoading}><legend className="mb-3 text-sm font-medium">Available times</legend>{availabilityLoading ? <p aria-live="polite" className="text-sm text-ink/60">Checking available times…</p> : times.length ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{times.map((slot) => <label key={slot} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2", time === slot ? "border-olive bg-olive text-white" : "border-taupe bg-white hover:border-gold hover:bg-sand/60")}><input type="radio" name="available-time" value={slot} required checked={time === slot} onChange={() => setTime(slot)} className="sr-only"/><span>{slot}</span></label>)}</div> : <p aria-live="polite" className="text-sm text-ink/65">{availabilityMessage}</p>}</fieldset></section>
        <section className="pb-4"><p className="mb-2 text-xs font-semibold text-gold">Your details</p><h2 className="mb-5 font-display text-4xl">Who should we contact?</h2><div className="grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-medium">Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required className={input}/></label><label className="flex flex-col gap-1.5 text-sm font-medium">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className={input}/></label><label className="flex flex-col gap-1.5 text-sm font-medium">Phone number <span className="font-normal text-ink/55">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="e.g. 081 234 5678" className={input}/></label><label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Notes for the studio <span className="font-normal text-ink/55">(optional)</span><textarea name="description" maxLength={5000} rows={5} placeholder="Share your preferred style, colours or any special requests." className="w-full rounded-xl border border-taupe bg-white px-3.5 py-3"/></label></div></section>
      </div>
      <aside className="border border-line bg-sand/70 p-6 md:p-7 lg:sticky lg:top-24"><h2 className="font-display text-4xl">Request summary</h2><div className="mt-4 flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Selection</span><b className="text-right">{item?.name ?? "Choose a service"}</b></div><div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Base price</span><b>{item?.priceConfirmed && item.price != null ? `R${item.price}` : "To be confirmed"}</b></div>{(item?.extras ?? []).filter((extra) => (extraQuantities[extra.key] ?? 0) > 0).map((extra) => <div key={extra.key} className="flex justify-between gap-3 border-b border-line py-2 text-xs"><span>{extra.name} × {extraQuantities[extra.key]}</span><b>R{extra.unitPrice * extraQuantities[extra.key]}</b></div>)}<div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>{item?.priceConfirmed ? "Estimated total" : "Price status"}</span><b>{typeof total === "number" ? `R${total}` : "Needs confirmation"}</b></div><div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Requested time</span><b className="text-right">{date && time ? date + " · " + time : "Choose a date and time"}</b></div><button type="submit" disabled={busy || !item || !date || !time || !item.durationMinutes} className={cn(buttonStyles(), "mt-5 w-full disabled:opacity-50")}>{busy ? "Sending request…" : "Send booking request"}</button>{item && !item.durationMinutes && <p className="mt-3 text-xs leading-5 text-rose">The studio needs to set an appointment length before this option can be booked online.</p>}<p className="mt-4 text-xs leading-relaxed text-ink/65">The studio reviews each request. You’ll receive an email when it has been approved or declined.</p><div className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink/70"><a href={studioContact.phoneHref} className="font-semibold text-olive underline">Call {studioContact.phone}</a></div></aside>
    </form>
  </>;
}
