"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import { studioContact } from "@/lib/data";

type Service = { _id: string; name: string; description: string; priceLabel: string; durationMinutes?: number };
const input = "h-12 w-full rounded-xl border border-taupe bg-white px-3.5 text-ink";

export default function BookingForm() {
  const query = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(query.get("service") ?? "");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/services").then((r) => r.json()).then((d) => setServices(d.services ?? [])).catch(() => setMessage("Services are temporarily unavailable.")); }, []);
  const service = services.find((item) => item._id === serviceId);
  useEffect(() => {
    if (!date || !serviceId) return;
    const selected = services.find((item) => item._id === serviceId);
    fetch(`/api/availability?date=${date}&duration=${selected?.durationMinutes || 30}`).then((r) => r.json()).then((d) => setTimes(d.times ?? [])).catch(() => setTimes([]));
  }, [date, serviceId, services]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ name: form.get("name"), phone: form.get("phone"), email: form.get("email"), description: form.get("description"), date, time, serviceId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn’t send your request.");
      setMessage(`Request received. Your reference is ${result.reference}. Our team will review it and contact you on WhatsApp to confirm your appointment. This is not a confirmed appointment.`);
      formElement.reset(); setDate(""); setTime(""); setServiceId("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn’t send your request."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="grid items-start gap-8 pb-16 pt-6 lg:grid-cols-[1fr_360px]">
    <div className="flex min-w-0 flex-col gap-6">
      <section className="border-b border-line pb-8">
        <p className="mb-1.5 text-xs font-semibold text-gold">Your service</p><h2 className="mb-5 font-display text-4xl font-medium">Choose a treatment</h2>
        {services.length ? <div className="grid gap-3 sm:grid-cols-2">{services.map((item) => <label key={item._id} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border border-taupe px-4", serviceId === item._id && "border-gold bg-sand")}><input type="radio" name="service" required checked={serviceId === item._id} onChange={() => { setServiceId(item._id); setTimes([]); setTime(""); }} className="accent-gold"/><span className="flex-1">{item.name}</span><span className="text-xs text-ink/55">{item.priceLabel || "Ask for price"}</span></label>)}</div> : <p className="text-sm text-ink/60">Loading services…</p>}
      </section>
      <section className="border-b border-line pb-8">
        <p className="mb-1.5 text-xs font-semibold text-gold">Your preference</p><h2 className="mb-5 font-display text-4xl font-medium">Choose a date and time</h2>
        <div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-medium">Preferred date<input type="date" required min={new Date().toLocaleDateString("en-CA")} value={date} onChange={(e) => { setDate(e.target.value); setTimes([]); setTime(""); }} className={input}/></label><label className="flex flex-col gap-2 text-sm font-medium">Available preferred time<select required value={time} onChange={(e) => setTime(e.target.value)} className={input} disabled={!date || !serviceId}><option value="">{!date ? "Choose a date first" : times.length ? "Choose a time" : "No configured times"}</option>{times.map((t) => <option key={t} value={t}>{t}</option>)}</select></label></div>
        <p className="mt-3 text-xs leading-5 text-ink/60">Your preferred date and time are a request. The studio will confirm availability with you.</p>
      </section>
      <section className="pb-4"><p className="mb-1.5 text-xs font-semibold text-gold">A little about you</p><h2 className="mb-5 font-display text-4xl font-medium">Help us prepare</h2>
        <div className="grid gap-5 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-[13px] font-medium">Full name<input name="name" autoComplete="name" minLength={2} maxLength={120} required className={input}/></label><label className="flex flex-col gap-1.5 text-[13px] font-medium">WhatsApp number<input name="phone" type="tel" autoComplete="tel" placeholder="e.g. 081 234 5678" required className={input}/></label><label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">Email (optional)<input name="email" type="email" autoComplete="email" className={input}/></label><label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">Tell us more about what you’d like.<textarea name="description" required maxLength={5000} rows={6} placeholder="Share your preferred style, colours, requirements or any special requests…" className="w-full rounded-xl border border-taupe bg-white px-3.5 py-3"/></label></div>
      </section>
    </div>
    <aside className="border border-line bg-sand/70 p-6 md:p-7 lg:sticky lg:top-24"><h2 className="mb-3 font-display text-4xl font-medium">Your request</h2><div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Service</span><b>{service?.name ?? "Not chosen"}</b></div><div className="flex justify-between gap-3 border-b border-line py-3 text-sm"><span>Date and time</span><b>{date && time ? `${date} · ${time}` : "Not chosen"}</b></div><button type="submit" disabled={busy || !service || !date || !time} className={cn(buttonStyles(), "mt-5 w-full disabled:opacity-50")}>{busy ? "Sending request…" : "Request an appointment"}</button><p className="mt-4 text-xs leading-relaxed text-ink/65">Your appointment is not confirmed when you submit this request.</p><div className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink/70"><a href={studioContact.phoneHref} className="mr-4 font-semibold text-olive underline">Call {studioContact.phone}</a><a href={studioContact.whatsappHref} className="font-semibold text-olive underline">WhatsApp us</a></div>{message && <p role="status" className="mt-4 border-l-2 border-rose pl-3 text-xs leading-relaxed">{message}</p>}</aside>
  </form>;
}
