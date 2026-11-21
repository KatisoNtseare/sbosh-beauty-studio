"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import {
  CURRENCY,
  serviceGroups,
  timeSlots,
  type Treatment,
} from "@/lib/data";

const card = "rounded-[20px] border border-line bg-white p-6 md:p-8";
const stepLabel =
  "mb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gold";
const stepTitle = "mb-5 font-display text-4xl font-medium";
const input =
  "h-12 w-full rounded-xl border border-taupe bg-white px-3.5 text-ink";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export default function BookingForm() {
  const [service, setService] = useState<Treatment | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = month.getFullYear();
  const m = month.getMonth();
  const leading = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoBack =
    month > new Date(today.getFullYear(), today.getMonth(), 1);
  const ready = Boolean(service && date && time);

  const sameDay = (a: Date | null, d: number) =>
    !!a && a.getFullYear() === year && a.getMonth() === m && a.getDate() === d;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    const form = new FormData(e.currentTarget);
    const booking = {
      service: service!.name,
      date: date!.toISOString(),
      time,
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      notes: form.get("notes"),
    };
    // TODO: send `booking` to your API route / email service
    console.log(booking);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-8 px-6 pb-24 pt-6 lg:grid-cols-[1fr_360px] md:px-16"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {/* Step 1 */}
        <section className={card}>
          <p className={stepLabel}>Step 1</p>
          <h2 className={stepTitle}>Choose a service</h2>

          {serviceGroups.map((group) => {
            const priced = group.treatments.filter((t) => t.price);
            if (!priced.length) return null;
            return (
              <fieldset key={group.id} className="mt-5">
                <legend className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  {group.title}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {priced.map((t) => (
                    <label
                      key={t.name}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border border-taupe px-4 text-[15px]",
                        service?.name === t.name && "border-gold bg-sand"
                      )}
                    >
                      <input
                        type="radio"
                        name="service"
                        className="accent-gold"
                        checked={service?.name === t.name}
                        onChange={() => setService(t)}
                      />
                      <span className="flex-1">{t.name}</span>
                      <b>
                        {CURRENCY}
                        {t.price}
                      </b>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </section>

        {/* Step 2 */}
        <section className={card}>
          <p className={stepLabel}>Step 2</p>
          <h2 className={stepTitle}>Pick a date &amp; time</h2>

          <div className="max-w-105">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoBack}
                onClick={() => setMonth(new Date(year, m - 1, 1))}
                className="size-11 rounded-full hover:bg-sand disabled:opacity-30"
              >
                ‹
              </button>
              <span className="font-semibold">
                {month.toLocaleDateString("en-ZA", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonth(new Date(year, m + 1, 1))}
                className="size-11 rounded-full hover:bg-sand"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {weekdays.map((d, i) => (
                <span
                  key={i}
                  className="py-1.5 text-center text-xs font-semibold text-gold"
                >
                  {d}
                </span>
              ))}
              {cells.map((d, i) =>
                d === null ? (
                  <span key={`e${i}`} />
                ) : (
                  <button
                    key={d}
                    type="button"
                    disabled={new Date(year, m, d) < today}
                    onClick={() => setDate(new Date(year, m, d))}
                    className={cn(
                      "h-12 rounded-xl bg-sand text-sm hover:bg-line disabled:cursor-default disabled:bg-transparent disabled:text-ink/50 disabled:hover:bg-transparent",
                      sameDay(date, d) && "bg-gold text-white hover:bg-gold"
                    )}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          </div>

          <p className="mb-3 mt-7 font-semibold">Available times</p>
          <div className="flex flex-wrap gap-2.5">
            {timeSlots.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={cn(
                  "min-h-12 rounded-full border border-taupe bg-white px-5 text-sm hover:border-gold",
                  time === t && "border-gold bg-gold text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 */}
        <section className={card}>
          <p className={stepLabel}>Step 3</p>
          <h2 className={stepTitle}>Your details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Full name
              <input name="name" type="text" required className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Phone number
              <input name="phone" type="tel" required className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
              Email
              <input name="email" type="email" required className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
              Notes (allergies, preferences)
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-xl border border-taupe bg-white px-3.5 py-3 text-ink"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className={cn(card, "lg:sticky lg:top-6")}>
        <h2 className="mb-3 font-display text-4xl font-medium">Summary</h2>
        {[
          ["Service", service?.name ?? "Not chosen"],
          [
            "Date",
            date
              ? date.toLocaleDateString("en-ZA", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : "Not chosen",
          ],
          ["Time", time ?? "Not chosen"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-3 border-b border-line py-3 text-[15px]"
          >
            <span>{label}</span>
            <b className="text-right">{value}</b>
          </div>
        ))}
        <div className="flex justify-between py-3 text-lg">
          <span>Total</span>
          <b>{service?.price ? `${CURRENCY}${service.price}` : "—"}</b>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className={cn(buttonStyles(), "mt-4 w-full")}
        >
          Confirm booking
        </button>
        <p className="mt-4 text-[13px] leading-relaxed">
          [YOUR CANCELLATION POLICY]
        </p>
      </aside>
    </form>
  );
}