import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import { serviceGroups, studioContact } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nail service menu | SBOSH Beauty Studio",
  description: "Browse confirmed manicure, gel nail, overlay, nail repair, and buff & shine services at SBOSH Beauty Studio.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="The nail menu"
        title="Find your nail service."
        lead="Explore the services offered at SBOSH Beauty Studio. Contact us for pricing and appointment availability."
      />

      <div className="mt-8 grid gap-x-16 lg:grid-cols-2">
        {serviceGroups.map((group) => (
          <section key={group.id} className="border-b border-line py-7 md:py-8">
            <div className="mb-4 flex items-baseline gap-3">
              <span aria-hidden="true" className="mb-1 size-2 rounded-full bg-rose/80" />
              <h2 className="font-display text-3xl font-medium">{group.title}</h2>
            </div>
            <ul>
              {group.treatments.map((treatment) => (
                <li key={treatment.name} className="flex items-baseline justify-between gap-4 border-t border-line/70 py-3.5 text-sm">
                  <span className="text-ink/75">{treatment.name}</span>
                  <a href={studioContact.phoneHref} className="shrink-0 text-xs font-medium text-olive underline decoration-olive/40 underline-offset-4 hover:decoration-olive">
                    Call for pricing
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-5 bg-sand px-6 py-7 md:flex-row md:items-center md:px-8">
        <div>
          <p className="font-display text-2xl font-medium">Ready to book?</p>
          <p className="mt-1 text-xs leading-5 text-ink/65">Call or WhatsApp the studio to discuss a time and service price.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={studioContact.phoneHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold px-6 text-sm font-semibold text-gold hover:bg-gold hover:text-white">Call {studioContact.phone}</a>
          <a href={studioContact.whatsappHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold-dark px-6 text-sm font-semibold text-white hover:bg-olive">WhatsApp us</a>
        </div>
      </div>
    </div>
  );
}
