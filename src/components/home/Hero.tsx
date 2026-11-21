import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-pale-blush text-dark-text md:min-h-[700px]">
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
        className="absolute inset-0 -z-10 bg-gradient-to-r from-pale-blush/90 via-brand-white/65 to-soft-pink/45"
      />
      <div className="mx-auto flex w-full max-w-7xl justify-center px-5 py-20 md:px-12 md:py-24">
        <div className="max-w-[900px] text-center">
          <h1 className="font-display text-[clamp(3.5rem,8vw,7.25rem)] font-semibold leading-[0.91] tracking-[-0.035em] text-dark-text">
            <span className="block">A fresh set.</span>
            <span className="mt-1 block text-brand-pink">A brighter mood.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[650px] text-sm font-medium leading-7 text-dark-text sm:text-base md:mt-8">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — thoughtful care for your next fresh set.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex min-h-14 min-w-[230px] items-center justify-center rounded-full bg-strong-pink px-8 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-raised-surface hover:text-silver focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-berry"
            >
              Book an appointment
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-deep-berry underline decoration-brand-pink/60 underline-offset-[5px] transition-colors hover:text-deep-berry focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-berry"
            >
              Explore services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
