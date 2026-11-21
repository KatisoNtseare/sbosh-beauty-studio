import Link from "next/link";
import { buttonStyles } from "@/lib/button";
import StudioIllustration from "@/components/home/StudioIllustration";

export default function Hero() {
  return (
    <section className="overflow-hidden px-6 md:px-16">
      <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-10 py-12 md:py-16 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <div className="relative z-10 py-8 lg:py-16">
          <p className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-olive">
            <span className="inline-block size-2 rounded-full bg-rose" />
            Beauty &amp; wellness, at your pace
          </p>
          <h1 className="max-w-[680px] font-display text-[clamp(3.75rem,7.2vw,7.4rem)] font-medium leading-[0.88] tracking-[-0.045em] text-ink">
            A softer way to take care of <span className="italic text-olive">you.</span>
          </h1>
          <p className="mt-8 max-w-[430px] text-[15px] leading-7 text-ink/75 md:text-base">
            Facials, brows, lashes, nails and massage, with space to slow down and feel looked after.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/book" className={buttonStyles({ className: "min-h-14 px-7" })}>
              Find your appointment
            </Link>
            <Link href="/#services" className="group inline-flex items-center gap-3 py-3 text-xs font-semibold text-ink/80">
              Explore treatments
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <p className="mt-14 flex items-center gap-3 font-display text-xl italic text-olive">
            <span aria-hidden="true" className="text-2xl not-italic text-rose">✳</span>
            Take a moment for yourself.
          </p>
        </div>

        <figure role="img" aria-label="Botanical illustration of a calm profile framed by leaves and a warm sun" className="relative mx-auto w-full max-w-[560px] lg:-mr-5">
          <div className="aspect-[0.92] overflow-hidden rounded-t-[48%] border-x border-t border-olive/15 bg-sand p-3 md:p-5">
            <div className="h-full w-full overflow-hidden rounded-t-[48%]">
              <StudioIllustration />
            </div>
          </div>
          <figcaption className="flex items-center justify-between border-b border-line py-3 text-[9px] font-medium uppercase tracking-[0.17em] text-ink/55">
            <span>Care, with room to breathe</span>
            <span>SBOSH · Beauty Studio</span>
          </figcaption>
          <span aria-hidden="true" className="absolute -left-5 top-[20%] -rotate-90 font-display text-sm italic tracking-wide text-gold md:-left-8">
            A little more like yourself
          </span>
        </figure>
      </div>
    </section>
  );
}
