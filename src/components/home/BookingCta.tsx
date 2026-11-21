import Link from "next/link";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";

export default function BookingCta() {
  return (
    <section className="relative overflow-hidden bg-deep-berry px-5 py-16 text-white sm:px-6 md:px-12 md:py-24 xl:px-16">
      <span aria-hidden="true" className="absolute -right-20 -top-28 size-72 rounded-full border border-rose-pink/35 md:right-[8%] md:size-[26rem]" />
      <span aria-hidden="true" className="absolute -right-4 -top-10 size-48 rounded-full border border-white/20 md:right-[14%] md:size-64" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 md:items-center md:text-center">
        <p className="flex items-center gap-3 text-xs font-semibold text-soft-blush">
          <span aria-hidden="true" className="size-2 rounded-full bg-rose-pink" />Your next little reset
        </p>
        <h2 className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
          Your nails. Your colour. <span className="italic text-soft-blush">Your moment.</span>
        </h2>
        <p className="max-w-xl text-sm leading-6 text-white/80 md:text-base">
          Choose a service and preferred time. We’ll email you after the studio reviews your request.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
          <Link href="/services" className={cn(buttonStyles(), "min-h-14 text-sm")}>Book your appointment</Link>
          <Link href="/cart" className="min-h-11 px-2 text-sm font-semibold text-white underline decoration-white/45 underline-offset-4 hover:text-soft-blush">Open booking cart</Link>
        </div>
      </div>
    </section>
  );
}
