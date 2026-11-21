import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-soft-blush text-dark-plum md:min-h-[700px]">
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
        className="absolute inset-0 -z-10 bg-gradient-to-r from-soft-blush/90 via-brand-white/65 to-pale-pink/45"
      />
      <span aria-hidden="true" className="absolute -right-20 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full border border-rose-pink/35 md:right-[8%] md:size-[26rem]" />

      <div className="mx-auto flex w-full max-w-7xl justify-center px-5 py-20 md:px-12 md:py-24">
        <div className="max-w-[900px] text-center">
          <p className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-pink/55 bg-white/90 px-4 text-xs font-semibold text-deep-berry shadow-sm backdrop-blur-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-rose-pink" />
            Bram Fischerville · Roodepoort
          </p>
          <h1 className="font-display text-[clamp(3.5rem,8vw,7.25rem)] font-semibold leading-[0.91] tracking-[-0.035em] text-dark-plum">
            <span className="block">A fresh set.</span>
            <span className="mt-1 block text-hot-pink">A brighter mood.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[650px] text-sm font-medium leading-7 text-dark-plum sm:text-base md:mt-8">
            Manicure, gel nails, overlay, nail repair and buff &amp; shine — colour, care and a little extra joy.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted-text sm:text-sm">
            Choose your service and send a request. We’ll email you when your appointment is reviewed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/services"
              className="group inline-flex min-h-14 min-w-[230px] items-center justify-center gap-3 rounded-full border border-white/80 bg-hot-pink px-8 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(112,38,79,0.2)] transition-colors hover:bg-deep-berry focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-berry"
            >
              Book an appointment
              <FiArrowUpRight aria-hidden="true" className="size-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="#services"
              className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-deep-berry underline decoration-hot-pink/60 underline-offset-[5px] transition-colors hover:text-deep-berry focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-berry"
            >
              Explore our services
            </Link>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-1 w-[min(88%,1160px)] -translate-x-1/2 rounded-full bg-hot-pink/75" />
    </section>
  );
}
