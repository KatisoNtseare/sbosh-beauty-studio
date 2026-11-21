import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import ServicesSection from "@/components/home/ServicesSection";
import { studioContact } from "@/lib/data";

export const metadata: Metadata = { title: "Nail service menu | SBOSH Beauty Studio", description: "Browse the current nail services and contact Sbosh Beauty Studio for pricing." };
export default function PricingPage() {
  return <><div className="mx-auto max-w-7xl px-6 pb-4 pt-14 md:px-16 md:pt-20"><PageIntro eyebrow="The nail menu" title="Find your nail service." lead="Service descriptions and prices are maintained by the studio. Contact us for a quote and appointment availability."/><div className="mt-6 flex flex-wrap gap-4 text-sm"><a href={studioContact.phoneHref} className="text-olive underline">Call {studioContact.phone}</a><a href={studioContact.whatsappHref} className="text-olive underline">WhatsApp the studio</a></div></div><ServicesSection /></>;
}
