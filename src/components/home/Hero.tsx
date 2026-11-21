import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[650px] items-center overflow-hidden bg-ink text-cream md:min-h-[720px]">
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
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(34,39,33,0.56)_0%,rgba(34,39,33,0.36)_50%,rgba(34,39,33,0.4)_100%),linear-gradient(0deg,rgba(34,39,33,0.5)_0%,rgba(34,39,33,0.08)_75%)]"
      />

      <div className="mx-auto flex w-full max-w-7xl justify-center px-5 py-20 md:px-12 md:py-24">
        <div className="max-w-[900px] text-center">
          <p className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-ink/25 px-4 text-xs font-medium text-white backdrop-blur-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-rose" />
            Your neighbourhood nail studio · Bram Fischerville
          </p>
          <h1 className="font-display text-[clamp(3.5rem,8vw,7.25rem)] font-medium leading-[0.91] tracking-[-0.035em] text-white">
            <span className="block">Thoughtful nail care,</span>
            <span className="mt-1 block">made personal.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[650px] text-sm leading-7 text-white/90 sm:text-base md:mt-8">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — beautifully finished in Roodepoort.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-white/75 sm:text-sm">
            Choose a service and send your request. The studio will confirm your appointment by email.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/services"
              className="group inline-flex min-h-14 min-w-[230px] items-center justify-center gap-3 rounded-full border border-rose bg-cream px-8 text-sm font-semibold text-gold-dark shadow-[0_10px_30px_rgba(25,28,23,0.3)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Book an appointment
              <FiArrowUpRight aria-hidden="true" className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="#services"
              className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium text-white underline decoration-white/55 underline-offset-[5px] transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Explore our services
            </Link>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-px w-[min(88%,1160px)] -translate-x-1/2 bg-white/40" />
    </section>
  );
}
