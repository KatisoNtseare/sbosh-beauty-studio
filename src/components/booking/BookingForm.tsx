"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import { studioContact } from "@/lib/data";
import { todayInSalon } from "@/lib/timezone";

type Service = { _id: string; name: string; description: string; fullDescription?: string; image: string; priceLabel: string; minimumPrice?: number; maximumPrice?: number };
type BookingToast = { id: number; type: "success" | "error"; message: string };
const input = "h-12 w-full rounded-xl border border-taupe bg-white px-3.5 text-ink";
const priceText = (item?: Service) => !item ? "—" : item.priceLabel || (item.minimumPrice != null && item.maximumPrice != null ? "R" + item.minimumPrice + "–R" + item.maximumPrice : item.minimumPrice != null ? "From R" + item.minimumPrice : "Price to be confirmed");

export default function BookingForm() {
  const query = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceId, setServiceId] = useState(query.get("service") ?? "");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("Choose a date to see available times.");
  const [time, setTime] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState<BookingToast | null>(null);
  const [busy, setBusy] = useState(false);
  const idempotencyKey = useRef("");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    fetch("/api/services").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Services are temporarily unavailable.");
      setServices(data.services ?? []);
    }).catch((error: Error) => setServiceError(error.message)).finally(() => setServicesLoaded(true));
  }, []);
  const service = services.find((item) => item._id === serviceId);

  useEffect(() => {
    if (!date || !serviceId) return;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    fetch("/api/availability?date=" + encodeURIComponent(date) + "&serviceId=" + encodeURIComponent(serviceId), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Availability could not be loaded.");
        setTimes(data.times ?? []);
        setAvailabilityMessage(data.error || (data.times?.length ? "Choose one of the available times." : "There are no available appointments on this date. Please choose another date."));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (timedOut) setAvailabilityMessage("Availability took too long to load. Please choose the date again.");
          return;
        }
        setTimes([]);
        setAvailabilityMessage(error instanceof Error ? error.message : "Availability could not be loaded.");
      })
      .finally(() => { window.clearTimeout(timeout); if (!controller.signal.aborted) setAvailabilityLoading(false); });
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [date, serviceId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    setBusy(true);
    setSuccess("");
    setToast(null);
    const form = new FormData(formElement);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current },
        body: JSON.stringify({ name: form.get("name"), phone: form.get("phone"), email: form.get("email"), description: form.get("description"), date, time, serviceId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t send your request.");
      const confirmation = result.emailStatus === "FAILED"
        ? "Request " + result.reference + " has been saved and is awaiting review. The studio’s email notification is delayed; your appointment is not confirmed yet."
        : "Request " + result.reference + " has been received and is awaiting review. The studio will email you after reviewing it. Your appointment is not confirmed yet.";
      setSuccess(confirmation);
      setToast({ id: Date.now(), type: "success", message: "Request received · " + result.reference });
      formElement.reset();
      setDate(""); setTime(""); setTimes([]); setAvailabilityLoading(false); setAvailabilityMessage("Choose a date to see available times.");
      idempotencyKey.current = crypto.randomUUID();
    } catch (error) {
      setToast({ id: Date.now(), type: "error", message: error instanceof Error ? error.message : "We couldn’t send your request." });
    } finally { setBusy(false); }
  }

  return <>
    {toast && <div key={toast.id} role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} className={cn("fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border bg-white px-5 py-4 shadow-xl", toast.type === "success" ? "border-olive/30" : "border-rose/40")}>
      <span aria-hidden="true" className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold text-white", toast.type === "success" ? "bg-olive" : "bg-rose")}>{toast.type === "success" ? "✓" : "!"}</span>
      <p className="flex-1 text-sm leading-6 text-ink">{toast.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)} className="grid h-8 w-8 place-items-center rounded-full text-xl text-ink/55 hover:bg-sand">×</button>
    </div>}
    {success && <div role="status" className="mt-6 border-l-4 border-olive bg-sand/70 p-5 text-sm leading-6">{success}</div>}
    <form onSubmit={submit} className="grid items-start gap-8 pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="border-b border-line pb-8">
          <p className="mb-2 text-xs font-semibold text-gold">Your selected service</p>
          {service ? <div className="grid gap-5 sm:grid-cols-[190px_1fr]">
            <div className="relative aspect-[4/3] overflow-hidden bg-sand"><Image src={service.image || "/images/hero.jpg"} alt={service.name} fill sizes="(max-width: 640px) 100vw, 190px" className="object-cover"/></div>
            <div><h2 className="font-display text-4xl">{service.name}</h2><p className="mt-2 text-sm leading-6 text-ink/70">{service.description || service.fullDescription || "Selected treatment at Sbosh's Beauty Studio."}</p><p className="mt-4 text-sm font-semibold">{priceText(service)}</p></div>
          </div> : <div><p className="text-sm text-ink/65">{servicesLoaded ? serviceError || "Choose a service to continue." : "Loading the service menu…"}</p>{services.length > 0 && <label className="mt-4 block max-w-md text-sm">Service<select required value={serviceId} onChange={(event) => { setServiceId(event.target.value); setTimes([]); setTime(""); setAvailabilityLoading(Boolean(date && event.target.value)); setAvailabilityMessage(date && event.target.value ? "Checking availability…" : "Choose a date to see available times."); }} className={input + " mt-2"}><option value="">Choose a service</option>{services.map((item) => <option key={item._id} value={item._id}>{item.name} · {priceText(item)}</option>)}</select></label>}</div>}
        </section>

        <section className="border-b border-line pb-8">
          <p className="mb-2 text-xs font-semibold text-gold">Choose your preference</p><h2 className="mb-5 font-display text-4xl">Date and available time</h2>
          <label className="flex max-w-sm flex-col gap-2 text-sm font-medium">Appointment date<input type="date" required min={todayInSalon()} value={date} onChange={(event) => { setDate(event.target.value); setTimes([]); setTime(""); setAvailabilityLoading(Boolean(event.target.value && serviceId)); setAvailabilityMessage(event.target.value && serviceId ? "Checking availability…" : "Choose a date to see available times."); }} className={input}/></label>
          <fieldset className="mt-5" aria-busy={availabilityLoading}>
            <legend className="mb-3 text-sm font-medium">Available times</legend>
            {availabilityLoading ? <p aria-live="polite" className="text-sm text-ink/60">Checking available times…</p> : times.length ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">{times.map((slot) => <label key={slot} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2", time === slot ? "border-olive bg-olive text-white" : "border-taupe bg-white hover:border-gold hover:bg-sand/60")}><input type="radio" name="available-time" value={slot} required checked={time === slot} onChange={() => setTime(slot)} className="sr-only"/><span>{slot}</span></label>)}</div> : <p aria-live="polite" className="text-sm text-ink/65">{availabilityMessage}</p>}
          </fieldset>
        </section>

        <section className="pb-4"><p className="mb-2 text-xs font-semibold text-gold">Your details</p><h2 className="mb-5 font-display text-4xl">Who should we contact?</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required className={input}/></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required className={input}/></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Phone number <span className="font-normal text-ink/55">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="e.g. 081 234 5678" className={input}/></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Notes for the studio <span className="font-normal text-ink/55">(optional)</span><textarea name="description" maxLength={5000} rows={5} placeholder="Share your preferred style, colours or any special requests." className="w-full rounded-xl border border-taupe bg-white px-3.5 py-3"/></label>
          </div>
        </section>
      </div>
      <aside className="border border-line bg-sand/70 p-6 md:p-7 lg:sticky lg:top-24">
        <h2 className="font-display text-4xl">Request summary</h2>
        <div className="mt-4 flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Service</span><b>{service?.name ?? "Choose a service"}</b></div>
        <div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Price</span><b>{priceText(service)}</b></div>
        <div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Requested time</span><b>{date && time ? date + " · " + time : "Choose a date and time"}</b></div>
        <button type="submit" disabled={busy || !service || !date || !time} className={cn(buttonStyles(), "mt-5 w-full disabled:opacity-50")}>{busy ? "Sending request…" : "Send booking request"}</button>
        <p className="mt-4 text-xs leading-relaxed text-ink/65">The studio reviews each request. You’ll receive an email when it has been approved or declined.</p>
        <div className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink/70"><a href={studioContact.phoneHref} className="font-semibold text-olive underline">Call {studioContact.phone}</a></div>
      </aside>
    </form>
  </>;
}
