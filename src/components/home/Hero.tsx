import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function Hero() {
  return (
    <section className="relative isolate flex h-[calc(100svh-83px)] items-center overflow-hidden bg-deep-berry">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_54%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-deep-berry/95 via-deep-berry/80 to-deep-berry/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-deep-berry/70 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10 md:px-16 md:py-12">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-rose-gold">Roodepoort nail studio</p>
          <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-charcoal sm:mt-5">
            A fresh set.
            <span className="mt-1 block italic text-rose-gold">A brighter mood.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-charcoal/85 sm:mt-6 sm:text-base sm:leading-7">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — thoughtful care for your next fresh set.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-4">
            <Link href="/services" className={buttonStyles({ variant: "light", className: "min-h-14 min-w-[230px]" })}>
              Book an appointment
            </Link>
            <Link href="/services" className={buttonStyles({ variant: "ghostLight", className: "min-h-14" })}>
              Explore services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
