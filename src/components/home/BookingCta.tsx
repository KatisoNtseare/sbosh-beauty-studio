import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function BookingCta() {
  return (
    <section className="relative overflow-hidden bg-charcoal px-5 py-16 text-silver sm:px-6 md:px-12 md:py-24 xl:px-16">
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-5 md:items-center md:text-center">
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Ready for your next appointment?
        </h2>
        <p className="max-w-xl text-sm leading-6 text-silver/80 md:text-base">
          Choose a service and preferred time. We’ll email you after the studio reviews your request.
        </p>
        <Link href="/services" className={buttonStyles({ className: "min-h-14 text-sm" })}>Book your appointment</Link>
      </div>
    </section>
  );
}
