import Link from "next/link";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";

export default function BookingCta() {
  return (
    <section className="relative overflow-hidden bg-gold-dark px-6 py-20 text-cream md:px-16 md:py-24">
      <span aria-hidden="true" className="absolute -right-14 -top-24 size-72 rounded-full border border-white/15 md:right-[9%] md:size-96" />
      <span aria-hidden="true" className="absolute -right-2 -top-12 size-52 rounded-full border border-white/10 md:right-[14%] md:size-72" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 md:items-center md:text-center">
        <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.04em] text-cream/75">
          <span className="text-rose">✳</span> Leave a little room for you
        </p>
        <h2 className="max-w-3xl font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">
          Make time for <span className="italic text-[#dec7a7]">feeling good.</span>
        </h2>
        <p className="max-w-md text-sm leading-6 text-cream/75 md:text-base">
          Choose your services and an available appointment time. The studio will review your request and contact you about approval.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
          <Link href="/services" className={cn(buttonStyles(), "bg-cream text-gold-dark hover:bg-white")}>Choose a service</Link>
          <Link href="/cart" className="text-xs font-semibold text-cream underline decoration-cream/40 underline-offset-4 hover:decoration-cream">Open booking cart</Link>
        </div>
      </div>
    </section>
  );
}
