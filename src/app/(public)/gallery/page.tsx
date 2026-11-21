import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { businessProfile } from "@/lib/brand";
import { studioContact } from "@/lib/data";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our studio",
  description: `Visit ${businessProfile.name} in Bram Fischerville, Roodepoort.`,
};

export default function GalleryPage() {
  return <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:px-12 md:py-16 xl:px-16">
    <PageIntro eyebrow="A warm welcome" title="A little care, close to home." lead="We’re a neighbourhood beauty studio in Bram Fischerville, Roodepoort, ready to help you find a nail service that feels like you." />
    <section className="mt-8 grid overflow-hidden rounded-3xl border border-soft-blush bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[300px] bg-pale-pink sm:min-h-[420px]">
        <Image src="/images/hero.jpg" alt="Nail polish and beauty products at Sbosh Beauty Studio" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
        <p className="text-xs font-semibold text-deep-berry">Sbosh Beauty Studio</p>
        <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-deep-berry sm:text-5xl">Your next favourite set starts here.</h2>
        <p className="mt-4 text-sm leading-7 text-dark-plum/85">Browse our current manicure, gel nail, overlay, nail repair and buff &amp; shine services. Send a booking request and we’ll follow up by email.</p>
        <address className="mt-5 not-italic text-sm leading-6 text-dark-plum/85">{studioContact.address}</address>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/services" className={cn(buttonStyles(), "min-h-12")}>Explore services</Link>
          <a href={studioContact.mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-hot-pink/35 bg-white px-5 text-sm font-semibold text-deep-berry transition-colors hover:bg-soft-blush">Get directions</a>
        </div>
      </div>
    </section>
  </div>;
}
