"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import { businessProfile } from "@/lib/brand";
import { todayInSalon } from "@/lib/timezone";
import { addCartEntry, getCartSnapshot, getServerCartSnapshot, saveCart, subscribeCart, type CartEntry } from "@/lib/cart";

type Extra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN"; componentName?: string };
type CatalogueItem = { _id: string; name: string; description: string; fullDescription?: string; image: string; category: string; price?: number; priceConfirmed: boolean; isPackage?: boolean; components?: { name: string }[]; extras?: Extra[] };
type BookingResult = { reference: string; status: string; totalPrice: number | null; priceNeedsConfirmation: boolean; customerEmailSent: boolean; preferredDate: string; preferredTime: string; items: { name: string; price?: number; priceConfirmed: boolean }[]; extras: { name: string; quantity: number; unitPrice: number; subtotal: number }[] };
type CartLine = { entry: CartEntry; item?: CatalogueItem };
const input = "h-12 w-full rounded-xl border border-pink-blush bg-white px-3.5 text-ink focus:border-pink-primary focus:outline-none focus:ring-2 focus:ring-pink-primary/20";
const lineKey = (line: CartEntry) => `${line.kind}:${line.id}`;
const methodLabel = (extra: Extra) => extra.method === "PER_NAIL" ? "per nail" : "per design";

function BookingImage({ item }: { item: CatalogueItem }) {
  const [src, setSrc] = useState(item.image || "/images/hero.jpg");
  return <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand"><Image src={src} alt={item.name} fill sizes="(max-width: 640px) 100vw, 190px" className="object-cover" onError={() => setSrc("/images/hero.jpg")}/></div>;
}

export default function BookingForm() {
  const query = useSearchParams();
  const queryService = query.get("service") ?? "";
  const queryPackage = query.get("package") ?? "";
  const [services, setServices] = useState<CatalogueItem[]>([]);
  const [packages, setPackages] = useState<CatalogueItem[]>([]);
  const cart = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose a date to see available times.");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<BookingResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const idempotencyKey = useRef("");

  useEffect(() => {
    const requested = queryPackage ? { kind: "package" as const, id: queryPackage } : queryService ? { kind: "service" as const, id: queryService } : null;
    if (requested) addCartEntry(requested);
  }, [queryPackage, queryService]);

  useEffect(() => {
    fetch("/api/services").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Services are temporarily unavailable.");
      setServices(data.services ?? []); setPackages(data.packages ?? []);
    }).catch((error: Error) => setServiceError(error.message)).finally(() => setItemsLoaded(true));
  }, []);

  const lines = useMemo<CartLine[]>(() => cart.map((entry) => ({ entry, item: (entry.kind === "package" ? packages : services).find((item) => item._id === entry.id) })), [cart, packages, services]);
  const itemsForQuote = useMemo(() => lines.filter((line): line is CartLine & { item: CatalogueItem } => Boolean(line.item)).map(({ entry }) => ({
    ...(entry.kind === "package" ? { packageId: entry.id } : { serviceId: entry.id }),
    extras: Object.entries(entry.extras).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => ({ key, quantity })),
  })), [lines]);
  const quoteQuery = JSON.stringify(itemsForQuote);
  const itemsReady = lines.length > 0 && itemsForQuote.length === lines.length;
  const allPricesSet = lines.length > 0 && lines.every((line) => line.item?.priceConfirmed && typeof line.item.price === "number");
  const extrasTotal = lines.reduce((sum, line) => sum + (line.item?.extras ?? []).reduce((itemSum, extra) => itemSum + extra.unitPrice * (line.entry.extras[extra.key] || 0), 0), 0);
  const total = allPricesSet ? lines.reduce((sum, line) => sum + Number(line.item?.price), 0) + extrasTotal : null;

  function updateCart(next: CartEntry[]) { saveCart(next); setSuccess(null); setTimes([]); setTime(""); setAvailabilityLoading(Boolean(date && next.length)); setAvailabilityMessage(date && next.length ? "Checking available times…" : "Choose a date to see available times."); }
  function updateExtra(entry: CartEntry, key: string, raw: string, extra: Extra) {
    const quantity = raw === "" ? 0 : Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10) { toast.error("Enter a quantity from 0 to 10."); return; }
    const next = cart.map((line) => lineKey(line) === lineKey(entry) ? { ...line, extras: { ...line.extras, [key]: quantity } } : line);
    updateCart(next);
    if (quantity) toast.success(`${extra.name} updated.`);
  }

  useEffect(() => {
    if (!date || !itemsReady) return;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    const params = new URLSearchParams({ date, items: quoteQuery });
    fetch("/api/availability?" + params.toString(), { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Availability could not be loaded.");
      const available = data.times ?? [];
      setTimes(available);
      setAvailabilityMessage(available.length ? "Choose one of the available times." : "No available appointment times on this date. Please select another date.");
      if (!available.length) toast.info("No available times on this date.");
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (timedOut) { setAvailabilityMessage("Availability took too long to load. Please choose the date again."); setAvailabilityLoading(false); }
        return;
      }
      setTimes([]); setAvailabilityMessage(error instanceof Error ? error.message : "Availability could not be loaded.");
      if (error instanceof Error) toast.warning(error.message);
    }).finally(() => { window.clearTimeout(timeout); if (!controller.signal.aborted) setAvailabilityLoading(false); });
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [date, itemsReady, quoteQuery]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !cart.length || !itemsReady || !date || !time || !times.includes(time)) {
      setValidationError("Choose services, an available date, and one of the available times.");
      toast.warning("Complete your service, date, and time selection.");
      return;
    }
    const formElement = event.currentTarget;
    if (!formElement.reportValidity()) { setValidationError("Check the required information and try again."); toast.warning("Enter your name and contact number."); return; }
    setBusy(true); setSuccess(null); setValidationError("");
    const form = new FormData(formElement);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const body = {
      items: itemsForQuote,
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      description: form.get("description"),
      date,
      time,
    };
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Booking could not be submitted.");
      setSuccess({ reference: result.reference, status: result.status, totalPrice: result.totalPrice, priceNeedsConfirmation: result.priceNeedsConfirmation, customerEmailSent: result.customerEmailSent === true, preferredDate: date, preferredTime: time, items: result.items ?? [], extras: result.extras ?? [] });
      toast.success("Your booking request has been submitted successfully!");
      saveCart([]); setDate(""); setTime(""); setTimes([]); setAvailabilityMessage("Choose a date to see available times."); setAvailabilityLoading(false);
      formElement.reset(); idempotencyKey.current = crypto.randomUUID();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Booking could not be submitted.";
      setValidationError(message); toast.error(message);
    } finally { setBusy(false); }
  }

  if (success) return <section className="mx-auto my-8 max-w-3xl overflow-hidden rounded-3xl border border-pink-primary/20 bg-white shadow-xl shadow-plum/5" aria-live="polite">
    <div className="border-b border-pink-blush bg-pale-pink p-6 md:p-10"><p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-pink-primary"><span aria-hidden="true" className="size-2 rounded-full bg-pink-hot"/>Request received</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-plum md:text-5xl">Your booking request is on its way.</h2></div>
    <div className="p-6 md:p-10">
    <p className="mt-4 text-sm leading-6 text-ink/70">{success.customerEmailSent ? "We emailed you a receipt and will email you again when the studio approves or declines your request." : "Your request is saved, but we could not send the receipt email. Keep your reference and contact the studio if you need an update."} Your appointment is not confirmed yet.</p>
    <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
      <div className="flex justify-between gap-4 py-3"><dt>Reference</dt><dd className="font-semibold">{success.reference}</dd></div>
      <div className="flex justify-between gap-4 py-3"><dt>Requested appointment</dt><dd>{success.preferredDate} at {success.preferredTime}</dd></div>
      <div className="border-y border-line py-3"><dt className="mb-2">Selected services</dt><dd className="space-y-1">{success.items.map((item, index) => <p key={item.name + index} className="flex justify-between gap-4"><span>{item.name}</span><span>{item.priceConfirmed && typeof item.price === "number" ? `R${item.price}` : "Price to be confirmed"}</span></p>)}</dd></div>
      {success.extras.length > 0 && <div className="border-b border-line py-3"><dt className="mb-2">Extras</dt><dd className="space-y-1">{success.extras.map((extra, index) => <p key={extra.name + index} className="flex justify-between gap-4"><span>{extra.name} × {extra.quantity}</span><span>R{extra.subtotal}</span></p>)}</dd></div>}
      <div className="flex justify-between gap-4 py-3"><dt>Status</dt><dd>{success.status}</dd></div>
      <div className="flex justify-between gap-4 py-3"><dt>Total</dt><dd>{success.priceNeedsConfirmation || success.totalPrice == null ? "Price to be confirmed with you" : `R${success.totalPrice}`}</dd></div>
    </dl><Link href="/services" className={cn(buttonStyles(), "mt-6 inline-flex")}>Browse services</Link>
    </div>
  </section>;

  if (!itemsLoaded) return <p className="py-10 text-sm text-ink/60">{serviceError || "Preparing your booking cart…"}</p>;

  const currentStep = !cart.length ? 1 : !date || !time ? 2 : 3;
  const progressSteps = ["Choose services", "Choose a time", "Your details"];

  return <form onSubmit={submit} className="pb-16 pt-6">
    <ol aria-label="Booking progress" className="mb-7 grid grid-cols-3 gap-2">
      {progressSteps.map((step, index) => <li key={step} aria-current={currentStep === index + 1 ? "step" : undefined} className={cn("flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold sm:gap-3 sm:px-4", currentStep === index + 1 ? "border-pink-primary bg-pink-primary text-white" : index + 1 < currentStep ? "border-pink-primary/20 bg-pink-blush text-plum" : "border-line bg-white text-ink/60")}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", currentStep === index + 1 ? "bg-white/20" : index + 1 < currentStep ? "bg-pink-primary text-white" : "bg-pale-pink text-plum")}>{index + 1}</span><span className="leading-4">{step}</span></li>)}
    </ol>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
    <div className="flex min-w-0 flex-col gap-5">
      <section className="rounded-3xl border border-pink-blush bg-white p-5 shadow-sm sm:p-6 md:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-semibold text-pink-primary">Step 1 · Your selection</p><h2 className="font-display text-4xl font-semibold text-plum">Booking cart</h2></div><Link href="/services#services" className="text-sm font-semibold text-pink-primary underline decoration-pink-primary/40 underline-offset-4">Add a service</Link></div>
        {!lines.length ? <p className="rounded-2xl border border-dashed border-pink-primary/35 bg-pale-pink p-6 text-sm text-plum/75">Your cart is empty. Choose a service to begin.</p> : <div className="space-y-3">
          {lines.map(({ entry, item }) => <article key={lineKey(entry)} className="grid gap-4 rounded-2xl border border-pink-blush bg-pale-pink/60 p-4 sm:grid-cols-[130px_minmax(0,1fr)]">
            {item ? <BookingImage item={item}/> : <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-sand text-xs text-ink/60">Unavailable item</div>}
            <div className="min-w-0"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold text-plum">{item?.name ?? "This service is no longer available"}</h3><p className="mt-1 text-xs text-ink/60">{entry.kind === "package" ? "Combination package" : item?.category}</p></div><button type="button" onClick={() => { updateCart(cart.filter((line) => lineKey(line) !== lineKey(entry))); toast.info("Item removed from your booking."); }} className="min-h-9 px-2 text-xs font-semibold text-pink-primary underline underline-offset-4">Remove</button></div>
              {item?.description && <p className="mt-2 text-sm leading-6 text-ink/65">{item.description}</p>}{item?.components?.length ? <p className="mt-2 text-xs text-ink/60">Includes {item.components.map((component) => component.name).join(" + ")}</p> : null}
              <p className="mt-3 text-sm font-semibold">{item?.priceConfirmed && item.price != null ? `R${item.price}` : "Price to be confirmed"}</p>
              {item?.extras?.length ? <div className="mt-4 border-t border-line pt-3"><h4 className="text-sm font-semibold">Optional extras</h4><div className="mt-2 divide-y divide-line">{item.extras.map((extra) => {
                const quantity = entry.extras[extra.key] || 0;
                return <div key={extra.key} className="grid grid-cols-[minmax(0,1fr)_86px_auto] items-center gap-3 py-2"><label htmlFor={`${lineKey(entry)}-${extra.key}`} className="text-xs">{extra.name}{extra.componentName && <span className="block text-[11px] text-ink/50">For {extra.componentName}</span>}<span className="mt-1 block text-[11px] text-ink/55">R{extra.unitPrice} {methodLabel(extra)}</span></label><input id={`${lineKey(entry)}-${extra.key}`} type="number" inputMode="numeric" min={0} max={10} step={1} value={quantity || ""} placeholder="0" aria-label={`${extra.name} quantity`} onChange={(event) => updateExtra(entry, extra.key, event.target.value, extra)} className="h-10 w-full rounded-lg border border-taupe bg-white px-2 text-sm"/><span className="text-xs font-semibold">{quantity ? `R${quantity * extra.unitPrice}` : "—"}</span></div>;
              })}</div><p className="mt-2 text-[11px] text-ink/55">For Nail Art and Chrome, enter nails. For 3D and Marble, enter designs.</p></div> : null}
            </div>
          </article>)}
        </div>}
      </section>

      <section className="rounded-3xl border border-pink-blush bg-white p-5 shadow-sm sm:p-6 md:p-7"><p className="mb-2 text-xs font-semibold text-pink-primary">Step 2 · Choose your appointment</p><h2 className="mb-5 font-display text-4xl font-semibold text-plum">Date and time</h2>
        <label className="flex max-w-sm flex-col gap-2 text-sm font-medium">Appointment date<input type="date" required min={todayInSalon()} value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); setTime(""); setTimes([]); setAvailabilityLoading(Boolean(nextDate && itemsReady)); setAvailabilityMessage(nextDate ? "Checking available times…" : "Choose a date to see available times."); setValidationError(""); }} className={input}/></label>
        <fieldset className="mt-5" aria-busy={availabilityLoading}><legend className="mb-3 text-sm font-semibold text-plum">Available times</legend>{availabilityLoading ? <p aria-live="polite" className="rounded-xl bg-pale-pink px-4 py-3 text-sm text-plum/75">Checking available times…</p> : times.length ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{times.map((slot) => <label key={slot} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-pink-primary focus-within:ring-offset-2", time === slot ? "border-pink-primary bg-pink-primary text-white shadow-sm" : "border-pink-blush bg-white text-plum hover:border-pink-primary hover:bg-pink-blush")}><input type="radio" name="available-time" value={slot} required checked={time === slot} onChange={() => { setTime(slot); setValidationError(""); }} className="sr-only"/><span>{slot}</span></label>)}</div> : <p aria-live="polite" className="rounded-xl bg-pale-pink px-4 py-3 text-sm text-plum/75">{date ? availabilityMessage : "Choose a date to see available times."}</p>}</fieldset>
        <p className="mt-3 text-xs text-ink/50">Appointment times use {businessProfile.timezone}.</p>
      </section>

      <section className="rounded-3xl border border-pink-blush bg-white p-5 shadow-sm sm:p-6 md:p-7"><p className="mb-2 text-xs font-semibold text-pink-primary">Step 3 · Your details</p><h2 className="mb-5 font-display text-4xl font-semibold text-plum">Who should we contact?</h2><div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required className={input}/></label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">Contact number<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} pattern="[+0-9 ()-]{7,30}" placeholder="e.g. 081 234 5678" required className={input}/></label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className={input}/><span className="text-xs font-normal text-ink/55">We’ll email your request receipt and the studio’s decision to this address.</span></label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Additional notes <span className="font-normal text-ink/55">(optional)</span><textarea name="description" maxLength={5000} rows={4} placeholder="Share a style preference or special request." className="w-full rounded-xl border border-taupe bg-white px-3.5 py-3"/></label>
      </div>{validationError && <p role="alert" className="mt-4 border-l-2 border-rose pl-3 text-sm text-rose">{validationError}</p>}</section>
    </div>

    <aside className="rounded-3xl border border-pink-primary/20 bg-pink-blush p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"><p className="mb-2 text-xs font-semibold text-pink-primary">Your booking</p><h2 className="font-display text-3xl font-semibold text-plum">Request summary</h2>
      {lines.map(({ entry, item }) => <div key={lineKey(entry)} className="flex justify-between gap-3 border-b border-pink-primary/15 py-3 text-sm"><span>{item?.name ?? "Unavailable item"}</span><b className="text-right text-plum">{item?.priceConfirmed && item.price != null ? `R${item.price}` : "To be confirmed"}</b></div>)}
      {lines.flatMap(({ entry, item }) => (item?.extras ?? []).filter((extra) => entry.extras[extra.key] > 0).map((extra) => <div key={`${lineKey(entry)}:${extra.key}`} className="flex justify-between gap-3 border-b border-pink-primary/15 py-2 text-xs"><span>{extra.name} · {entry.extras[extra.key]} {methodLabel(extra).replace("per ", "")}</span><b>R{extra.unitPrice * entry.extras[extra.key]}</b></div>))}
      <div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Booking total</span><b>{total == null ? "Price to be confirmed" : `R${total}`}</b></div>
      <div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Requested time</span><b className="text-right">{date && time ? `${date} · ${time}` : "Choose a date and time"}</b></div>
      <button type="submit" disabled={busy || !cart.length || !itemsReady || !date || !time || !times.includes(time)} className={cn(buttonStyles(), "mt-5 w-full disabled:opacity-50")}>{busy ? "Sending request…" : "Submit booking request"}</button>
      <p className="mt-4 text-xs leading-relaxed text-ink/65">The studio will review your request and contact you about approval. Your appointment is not confirmed until approved.</p>
    </aside>
  </div></form>;
}
