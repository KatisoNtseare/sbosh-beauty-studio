import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import ServicesSection from "@/components/home/ServicesSection";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Nail & Lash Services in Roodepoort", description: `Explore nail and lash appointments in Bram Fischerville, Roodepoort. Browse manicures, gel nails, overlays, nail repair, and buff & shine at ${businessProfile.name}.` };
export default function ServicesPage() {
  return <><div className="mx-auto max-w-7xl px-6 pb-4 pt-14 md:px-16 md:pt-20"><PageIntro eyebrow="Bram Fischerville · Roodepoort" title="Nail and lash services, close to home." lead={`Find a local nail technician in Bram Fischerville and explore the nail and lash appointments available at ${businessProfile.name}.`} /></div><ServicesSection /></>;
}
