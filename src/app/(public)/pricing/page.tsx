import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import ServicesSection from "@/components/home/ServicesSection";
import { studioContact } from "@/lib/data";
import Link from "next/link";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Services and packages", description: `Browse current nail services and packages at ${businessProfile.name}.` };
export default function PricingPage() {
  return <><div className="mx-auto max-w-7xl px-5 pb-4 pt-12 sm:px-6 md:px-12 md:pt-16 xl:px-16"><PageIntro eyebrow="The nail menu" title="Find your next favourite." lead="Browse the studio’s live services and packages, with current prices and availability."/><div className="mt-6 flex flex-wrap gap-4 text-sm"><a href={studioContact.phoneHref} className="font-semibold text-deep-berry underline decoration-hot-pink/40 underline-offset-4">Call {studioContact.phone}</a><Link href="/services" className="font-semibold text-deep-berry underline decoration-hot-pink/40 underline-offset-4">Request an appointment</Link></div></div><ServicesSection /></>;
}
