"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";
import {
  serviceGroups,
  studioContact,
  type Treatment,
} from "@/lib/data";

const section = "border-b border-line pb-8";
const stepLabel =
  "mb-1.5 text-xs font-semibold text-gold";
const stepTitle = "mb-5 font-display text-4xl font-medium";
const input =
  "h-12 w-full rounded-xl border border-taupe bg-white px-3.5 text-ink";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export default function BookingForm() {
  const [service, setService] = useState<Treatment | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
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
    setSubmissionMessage(
      "Your details have not been sent. Online booking still needs to be connected to the studio."
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-8 pb-16 pt-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {/* Step 1 */}
        <section className={section}>
          <p className={stepLabel}>Step 1</p>
          <h2 className={stepTitle}>Choose a service</h2>

          {serviceGroups.map((group) => {
            if (!group.treatments.length) return null;
            return (
              <fieldset key={group.id} className="mt-5">
                <legend className="mb-2.5 text-xs font-semibold text-gold">
                  {group.title}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.treatments.map((t) => (
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
                        onChange={() => {
                          setService(t);
                          setSubmissionMessage(null);
                        }}
                      />
                      <span className="flex-1">{t.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </section>

        {/* Step 2 */}
        <section className={section}>
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
                    onClick={() => {
                      setDate(new Date(year, m, d));
                      setSubmissionMessage(null);
                    }}
                    aria-pressed={sameDay(date, d)}
                    aria-label={`Choose ${new Date(year, m, d).toLocaleDateString("en-ZA", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}`}
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

          <label htmlFor="preferred-time" className="mb-3 mt-7 block font-semibold">Your preferred time</label>
          <input
            id="preferred-time"
            type="time"
            required
            value={time ?? ""}
            onChange={(event) => {
              setTime(event.target.value || null);
              setSubmissionMessage(null);
            }}
            className="h-12 w-full max-w-60 rounded-xl border border-taupe bg-white px-3.5 text-ink"
          />
          <p className="mt-2 text-xs leading-5 text-ink/60">We’ll confirm the time with you before the appointment.</p>
        </section>

        {/* Step 3 */}
        <section className={section}>
          <p className={stepLabel}>Step 3</p>
          <h2 className={stepTitle}>Your details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Full name
              <input name="name" type="text" autoComplete="name" required className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              Phone number
              <input name="phone" type="tel" autoComplete="tel" required className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
              Email
              <input name="email" type="email" autoComplete="email" required className={input} />
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
      <aside className="border border-line bg-sand/70 p-6 md:p-7 lg:sticky lg:top-24">
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
        <div className="flex justify-between gap-3 py-3 text-sm">
          <span>Price</span>
          <b className="text-right">{service ? "Contact the studio" : "—"}</b>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className={cn(buttonStyles(), "mt-4 w-full")}
        >
          Request an appointment
        </button>
        <p className="mt-4 text-[12px] leading-relaxed text-ink/65">
          Your date and time are preferences; they are not confirmed until the studio responds.
        </p>
        <div className="mt-4 border-t border-line pt-4 text-xs leading-5 text-ink/70">
          <p className="mb-2">For pricing or to confirm availability:</p>
          <a href={studioContact.phoneHref} className="mr-4 font-semibold text-olive underline decoration-olive/40 underline-offset-4">Call {studioContact.phone}</a>
          <a href={studioContact.whatsappHref} className="font-semibold text-olive underline decoration-olive/40 underline-offset-4">WhatsApp us</a>
        </div>
        {submissionMessage && <p role="status" className="mt-4 border-l-2 border-rose pl-3 text-[12px] leading-relaxed text-ink/75">{submissionMessage} Call or WhatsApp us using the links above.</p>}
      </aside>
    </form>
  );
}
