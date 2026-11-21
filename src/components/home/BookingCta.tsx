import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function BookingCta() {
  return (
    <section className="flex flex-col items-start gap-5 px-6 py-24 md:items-center md:px-16 md:text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
        Easy online booking
      </span>
      <h2 className="font-display text-5xl font-medium leading-tight">
        Ready when you are
      </h2>
      <p className="max-w-md text-lg leading-relaxed">
        Choose a service, pick a time that suits you and we will confirm
        instantly.
      </p>
      <Link href="/book" className={buttonStyles()}>
        Book your appointment
      </Link>
    </section>
  );
}