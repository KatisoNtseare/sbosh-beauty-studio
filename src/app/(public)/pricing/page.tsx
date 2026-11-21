import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import ServicesSection from "@/components/home/ServicesSection";
import { studioContact } from "@/lib/data";
import Link from "next/link";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Nail service menu", description: `Browse the current nail services and send a request to ${businessProfile.name}.` };
export default function PricingPage() {
  return <><div className="mx-auto max-w-7xl px-6 pb-4 pt-14 md:px-16 md:pt-20"><PageIntro eyebrow="The nail menu" title="Find your nail service." lead="Choose a treatment and preferred time. The studio will email you after reviewing your request."/><div className="mt-6 flex flex-wrap gap-4 text-sm"><a href={studioContact.phoneHref} className="text-olive underline">Call {studioContact.phone}</a><Link href="/cart" className="text-olive underline">Request an appointment</Link></div></div><ServicesSection /></>;
}
