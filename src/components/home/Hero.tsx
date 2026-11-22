import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function Hero() {
  return (
    <section className="relative isolate flex h-[70svh] min-h-[70svh] items-center overflow-hidden bg-deep-berry md:h-[calc(100svh-82px)] md:min-h-[calc(100svh-82px)]">
      <Image
        src="/images/hero_image.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_54%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-deep-berry/65 via-deep-berry/75 to-deep-berry/90 md:bg-gradient-to-r md:from-deep-berry/95 md:via-deep-berry/80 md:to-deep-berry/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-deep-berry/70 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:px-16 md:py-12">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-rose-gold">Bram Fischerville nail &amp; lash studio</p>
          <h1 className="mt-4 font-display text-[clamp(2.45rem,11vw,4rem)] font-semibold leading-[0.94] tracking-[-0.03em] text-charcoal sm:mt-5 md:text-[clamp(2.75rem,7vw,6.5rem)]">
            A fresh set.
            <span className="mt-1 block italic text-rose-gold">A brighter mood.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-[1.55] text-charcoal/90 sm:mt-6 sm:text-base sm:leading-7">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine - thoughtful care for your next fresh set.
          </p>
          <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:mt-7">
            <Link href="/services" className={buttonStyles({ variant: "light", className: "min-h-12 w-full sm:min-h-14 sm:w-auto sm:min-w-[230px]" })}>
              Book an appointment
            </Link>
            <Link href="/services" className={buttonStyles({ variant: "ghostLight", className: "min-h-12 w-full sm:min-h-14 sm:w-auto" })}>
              Explore services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
