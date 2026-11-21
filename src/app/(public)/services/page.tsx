import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { serviceGroups, studioContact } from "@/lib/data";
import { buttonStyles } from "@/lib/button";

export const metadata: Metadata = {
  title: "Nail care services | SBOSH Beauty Studio",
  description: "Explore manicure, gel nail, overlay, nail repair, and buff & shine services at SBOSH Beauty Studio.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="The nail menu"
        title="Care for the way you want to feel."
        lead="Explore the confirmed nail services and choose the finish that feels right for you."
      />

      <div className="mt-3 border-t border-line">
        {serviceGroups.map((group) => (
          <section key={group.id} className="grid gap-5 border-b border-line py-8 sm:grid-cols-[70px_0.8fr_1.2fr] sm:gap-8 md:py-10">
            <span aria-hidden="true" className="mt-1.5 size-2 rounded-full bg-rose/80" />
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
        <p className="max-w-lg text-sm leading-6 text-ink/70">Contact the studio to ask about pricing and appointment availability.</p>
        <div className="flex flex-wrap gap-3">
          <a href={studioContact.phoneHref} className={buttonStyles({ variant: "outline" })}>Call {studioContact.phone}</a>
          <a href={studioContact.whatsappHref} className={buttonStyles()}>WhatsApp the studio</a>
        </div>
      </div>
    </div>
  );
}
