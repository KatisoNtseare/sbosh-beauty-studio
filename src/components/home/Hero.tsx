import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-ink text-cream md:min-h-[740px]">
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
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(35,34,29,0.82)_0%,rgba(35,34,29,0.64)_43%,rgba(35,34,29,0.13)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(35,34,29,0.3)_0%,transparent_38%)]"
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-16 md:py-24">
        <div className="max-w-[690px]">
          <p className="mb-7 flex items-center gap-3 text-[11px] font-semibold tracking-[0.04em] text-cream/90">
            <span className="inline-block size-2 rounded-full bg-rose" />
            Nail care, at your pace
          </p>
          <h1 className="font-display text-[clamp(3.75rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.045em] text-white">
            A softer way to take care of <span className="italic text-[#e8d5bd]">you.</span>
          </h1>
          <p className="mt-8 max-w-[470px] text-[15px] leading-7 text-white/85 md:text-base">
            Manicures, gel nails, overlays, nail repair, buff &amp; shine — with a little room to slow down and feel looked after.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/services" className={cn(buttonStyles(), "min-h-14 bg-cream px-7 text-olive hover:bg-white")}>
              Browse services
            </Link>
            <Link href="/#services" className="group inline-flex items-center gap-3 py-3 text-xs font-semibold text-white/90 underline decoration-white/45 underline-offset-4 hover:decoration-white">
              Explore treatments
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <p className="mt-12 flex items-center gap-3 font-display text-xl italic text-white/90">
            <span aria-hidden="true" className="text-2xl not-italic text-[#e8b9a9]">✳</span>
            Take a moment for yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
