import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function BookingCta() {
  return (
    <section className="relative overflow-hidden bg-gold-dark px-6 py-20 text-cream md:px-16 md:py-24">
      <span aria-hidden="true" className="absolute -right-14 -top-24 size-72 rounded-full border border-white/15 md:right-[9%] md:size-96" />
      <span aria-hidden="true" className="absolute -right-2 -top-12 size-52 rounded-full border border-white/10 md:right-[14%] md:size-72" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 md:items-center md:text-center">
        <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/75">
          <span className="text-rose">✳</span> Leave a little room for you
        </p>
        <h2 className="max-w-3xl font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">
          Make time for <span className="italic text-[#dec7a7]">feeling good.</span>
        </h2>
        <p className="max-w-md text-sm leading-6 text-cream/75 md:text-base">
          Choose the treatment you have in mind and tell us when you’d like to visit.
        </p>
        <Link href="/book" className={buttonStyles({ className: "mt-2 bg-cream text-gold-dark hover:bg-white" })}>
          Start a booking
        </Link>
      </div>
    </section>
  );
}
