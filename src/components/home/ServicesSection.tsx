import Link from "next/link";
import { serviceGroups } from "@/lib/data";

export default function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-24 border-y border-line bg-sand/65 px-6 py-20 md:px-16 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-5 md:grid-cols-[1fr_300px] md:items-end md:gap-10">
          <div>
            <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-olive">
              <span className="h-px w-8 bg-rose" />Thoughtful care, from head to toe
            </p>
            <h2 className="font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">
              Find your <span className="italic text-olive">ritual.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-ink/70">
            A few ways to reset and feel refreshed. Choose what you need today; there’s no one way to feel good.
          </p>
        </div>

        <div className="border-t border-line">
          {serviceGroups.map((group, index) => (
            <Link
              key={group.id}
              href="/book"
              className="group grid gap-3 border-b border-line py-6 transition-colors hover:bg-cream/60 sm:grid-cols-[70px_0.8fr_1.2fr_28px] sm:items-center sm:gap-5 md:py-7"
            >
              <span className="font-display text-lg italic text-gold/80">0{index + 1}</span>
              <h3 className="font-display text-2xl font-medium md:text-[27px]">{group.title}</h3>
              <span className="text-xs leading-6 text-ink/65">{group.treatments.map((treatment) => treatment.name).join("  ·  ")}</span>
              <span aria-hidden="true" className="hidden text-lg text-olive transition-transform group-hover:translate-x-1 sm:block">↗</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-ink/60">
          <span>Not sure where to begin? We can help you choose.</span>
          <Link href="/services" className="font-semibold text-olive underline decoration-olive/40 underline-offset-4 hover:decoration-olive">
            See service details
          </Link>
        </div>
      </div>
    </section>
  );
}
