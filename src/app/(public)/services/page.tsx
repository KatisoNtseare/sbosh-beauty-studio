import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { serviceGroups } from "@/lib/data";
import { buttonStyles } from "@/lib/button";

export const metadata: Metadata = {
  title: "Beauty & wellness services | SBOSH Beauty Studio",
  description: "Explore facial, brow, lash, nail, massage and makeup services at SBOSH Beauty Studio.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="A menu of little resets"
        title="Care for the way you want to feel."
        lead="Explore the treatments on offer and choose the kind of care that feels right for you today."
      />

      <div className="mt-3 border-t border-line">
        {serviceGroups.map((group, index) => (
          <section key={group.id} className="grid gap-5 border-b border-line py-8 sm:grid-cols-[70px_0.8fr_1.2fr] sm:gap-8 md:py-10">
            <span className="font-display text-lg italic text-gold">0{index + 1}</span>
            <h2 className="font-display text-3xl font-medium leading-none md:text-4xl">{group.title}</h2>
            <ul className="grid gap-x-8 gap-y-3 text-sm text-ink/75 sm:grid-cols-2">
              {group.treatments.map((treatment) => (
                <li key={treatment.name} className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" />
                  {treatment.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-5 border-l-2 border-olive pl-5 sm:flex-row sm:items-center sm:pl-7">
        <p className="max-w-lg text-sm leading-6 text-ink/70">See current prices, or choose an appointment and tell us what you have in mind.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pricing" className={buttonStyles({ variant: "outline" })}>View pricing</Link>
          <Link href="/book" className={buttonStyles()}>Book a visit</Link>
        </div>
      </div>
    </div>
  );
}
