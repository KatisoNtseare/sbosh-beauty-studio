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
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(58,18,48,0.76)_0%,rgba(88,28,77,0.48)_53%,rgba(58,18,48,0.32)_100%),linear-gradient(0deg,rgba(58,18,48,0.48)_0%,rgba(58,18,48,0.04)_76%)]"
      />
      <span aria-hidden="true" className="absolute -right-20 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full border border-pink-hot/35 md:right-[8%] md:size-[26rem]" />

      <div className="mx-auto flex w-full max-w-7xl justify-center px-5 py-20 md:px-12 md:py-24">
        <div className="max-w-[900px] text-center">
          <p className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/35 bg-plum/35 px-4 text-xs font-medium text-white backdrop-blur-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-pink-hot" />
            Bram Fischerville · Roodepoort
          </p>
          <h1 className="font-display text-[clamp(3.5rem,8vw,7.25rem)] font-medium leading-[0.91] tracking-[-0.035em] text-white">
            <span className="block">A fresh set.</span>
            <span className="mt-1 block text-pink-blush">A brighter mood.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[650px] text-sm leading-7 text-white/90 sm:text-base md:mt-8">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — colour, care and a little extra joy.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-white/75 sm:text-sm">
            Choose your service and send a request. We’ll email you when your appointment is reviewed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/services"
              className="group inline-flex min-h-14 min-w-[230px] items-center justify-center gap-3 rounded-full border border-white/25 bg-pink-primary px-8 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(40,10,34,0.32)] transition-colors hover:bg-plum focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
      <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-px w-[min(88%,1160px)] -translate-x-1/2 bg-pink-hot/70" />
    </section>
  );
}
