import Link from "next/link";
import { CURRENCY, pricedTreatments } from "@/lib/data";
import StudioMoodboard from "@/components/home/StudioMoodboard";

export default function PricingGallery() {
  return (
    <section className="px-6 py-20 md:px-16 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.86fr_1.14fr] lg:gap-24">
        <div id="pricing" className="scroll-mt-28">
          <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-olive">
            <span className="h-px w-8 bg-rose" />A clear place to start
          </p>
          <h2 className="mb-8 font-display text-5xl font-medium leading-[0.94] tracking-tight md:text-6xl">
            The price of<br /><span className="italic text-olive">feeling good.</span>
          </h2>
          <dl className="border-t border-line">
            {pricedTreatments.map((treatment) => (
              <div key={treatment.name} className="flex items-baseline justify-between gap-5 border-b border-line py-4">
                <dt className="text-sm text-ink/80">{treatment.name}</dt>
                <dd className="font-display text-xl font-semibold text-gold-dark">{CURRENCY}{treatment.price}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-sm text-xs leading-5 text-ink/55">
            Makeup and consultation services are available too. Ask us about the right option when you book.
          </p>
          <Link href="/pricing" className="mt-6 inline-flex items-center gap-3 text-xs font-semibold text-olive underline decoration-olive/40 underline-offset-4 hover:decoration-olive">
            View the full price list <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div id="gallery" className="scroll-mt-28">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-olive">
                <span className="h-px w-8 bg-rose" />A feeling, in colour
              </p>
              <h2 className="font-display text-5xl font-medium leading-[0.94] tracking-tight md:text-6xl">
                Studio <span className="italic text-olive">moodboard.</span>
              </h2>
            </div>
            <span className="hidden font-display text-4xl italic text-rose md:block">✳</span>
          </div>
          <StudioMoodboard />
        </div>
      </div>
    </section>
  );
}
