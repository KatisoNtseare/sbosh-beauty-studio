import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import ServicesSection from "@/components/home/ServicesSection";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Nail care services", description: `Explore manicure, gel nail, overlay, nail repair, and buff & shine services at ${businessProfile.name}.` };
export default function ServicesPage() {
  return <><div className="mx-auto max-w-7xl px-6 pb-4 pt-14 md:px-16 md:pt-20"><PageIntro eyebrow="The nail menu" title="Care for the way you want to feel." lead={`Explore the services offered at ${businessProfile.name} and choose the finish that feels right for you.`} /></div><ServicesSection /></>;
}
