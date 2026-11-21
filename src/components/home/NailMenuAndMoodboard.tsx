"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudioMoodboard from "@/components/home/StudioMoodboard";
import { studioContact } from "@/lib/data";

type Treatment = { _id: string; name: string };

export default function NailMenuAndMoodboard() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  useEffect(() => { fetch("/api/services").then((r) => r.json()).then((d) => setTreatments(d.services ?? [])).catch(() => setTreatments([])); }, []);
  return (
    <section className="px-6 py-20 md:px-16 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.86fr_1.14fr] lg:gap-24">
        <div id="pricing" className="scroll-mt-28">
          <p className="mb-4 flex items-center gap-3 text-[11px] font-semibold tracking-[0.04em] text-olive">
            <span className="h-px w-8 bg-rose" />The nail menu
          </p>
          <h2 className="mb-8 font-display text-5xl font-medium leading-[0.94] tracking-tight md:text-6xl">
            A little care,<br /><span className="italic text-olive">your way.</span>
          </h2>
          <ul className="border-t border-line">
            {treatments.map((treatment) => (
              <li key={treatment.name} className="flex items-center gap-4 border-b border-line py-4 text-sm text-ink/80">
                <span aria-hidden="true" className="size-2 rounded-full bg-rose/80" />
                {treatment.name}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-sm text-xs leading-5 text-ink/60">Contact the studio for service prices and appointment availability.</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-olive">
            <a href={studioContact.phoneHref} className="underline decoration-olive/40 underline-offset-4 hover:decoration-olive">Call {studioContact.phone}</a>
            <a href={studioContact.whatsappHref} className="underline decoration-olive/40 underline-offset-4 hover:decoration-olive">WhatsApp us</a>
          </div>
          <Link href="/pricing" className="mt-6 inline-flex items-center gap-3 text-xs font-semibold text-olive underline decoration-olive/40 underline-offset-4 hover:decoration-olive">
            See the full nail menu <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div id="gallery" className="scroll-mt-28">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <p className="mb-4 flex items-center gap-3 text-[11px] font-semibold tracking-[0.04em] text-olive">
                <span className="h-px w-8 bg-rose" />A feeling, in colour
              </p>
              <h2 className="font-display text-5xl font-medium leading-[0.94] tracking-tight md:text-6xl">
                Studio <span className="italic text-olive">moodboard.</span>
              </h2>
            </div>
            <span aria-hidden="true" className="hidden font-display text-4xl italic text-rose md:block">✳</span>
          </div>
          <StudioMoodboard />
        </div>
      </div>
    </section>
  );
}
