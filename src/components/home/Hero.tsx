import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[640px] items-center overflow-hidden bg-deep-berry md:min-h-[780px]">
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

      <div className="mx-auto w-full max-w-7xl px-5 py-24 md:px-16">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-rose-gold">Roodepoort nail studio</p>
          <h1 className="mt-6 font-display text-[clamp(3.5rem,8vw,7rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-charcoal">
            A fresh set.
            <span className="mt-1 block italic text-rose-gold">A brighter mood.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-charcoal/85">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — thoughtful care for your next fresh set.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
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