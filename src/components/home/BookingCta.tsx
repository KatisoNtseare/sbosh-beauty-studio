import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function BookingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-deep-berry px-5 py-20 text-charcoal sm:px-6 md:px-12 md:py-28 xl:px-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_50%_0%,rgb(227_181_160/0.2),transparent)]"
      />
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:items-center md:text-center">
        <p className="eyebrow text-rose-gold">Reserve your time</p>
        <h2 className="max-w-3xl font-display text-5xl font-semibold leading-[1] tracking-tight md:text-7xl">
          Ready for your next appointment?
        </h2>
        <p className="max-w-xl text-base leading-7 text-charcoal/80">
          Choose a service and preferred time. We’ll email you after the studio reviews your request.
        </p>
        <Link href="/services" className={buttonStyles({ variant: "light", className: "mt-2 min-h-14" })}>
          Book your appointment
        </Link>
      </div>
    </section>
  );
}