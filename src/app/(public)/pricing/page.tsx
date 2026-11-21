import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { CURRENCY, serviceGroups } from "@/lib/data";
import { buttonStyles } from "@/lib/button";

export const metadata: Metadata = {
  title: "Treatment prices | SBOSH Beauty Studio",
  description: "Browse treatment prices for facials, brows, lashes, nails and massage at SBOSH Beauty Studio.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="The service menu"
        title="Good care, clearly priced."
        lead="Browse the current treatment prices below. Makeup and consultation services can be discussed when you get in touch."
      />

      <div className="mt-8 grid gap-x-16 lg:grid-cols-2">
        {serviceGroups.map((group, index) => (
          <section key={group.id} className="border-b border-line py-7 md:py-8">
            <div className="mb-4 flex items-baseline gap-4">
              <span className="font-display text-base italic text-gold">0{index + 1}</span>
              <h2 className="font-display text-3xl font-medium">{group.title}</h2>
            </div>
            <dl>
              {group.treatments.map((treatment) => (
                <div key={treatment.name} className="flex items-baseline justify-between gap-4 border-t border-line/70 py-3.5 text-sm">
                  <dt className="text-ink/75">{treatment.name}</dt>
                  <dd className="font-medium text-olive">
                    {treatment.price ? `${CURRENCY}${treatment.price}` : <Link href="/book" className="underline decoration-olive/40 underline-offset-4 hover:decoration-olive">Ask us</Link>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-5 bg-sand px-6 py-7 md:flex-row md:items-center md:px-8">
        <div>
          <p className="font-display text-2xl font-medium">Found your treatment?</p>
          <p className="mt-1 text-xs leading-5 text-ink/65">Choose a preferred date and time to start your booking request.</p>
        </div>
        <Link href="/book" className={buttonStyles()}>Book a visit</Link>
      </div>
    </div>
  );
}
