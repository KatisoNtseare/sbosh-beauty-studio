import type { Metadata } from "next";
import { businessProfile } from "@/lib/brand";
import PriceList from "@/components/home/PriceList";

export const metadata: Metadata = {
  title: "Services and packages",
  description: `Browse current nail services and packages at ${businessProfile.name}.`,
};

export default function PricingPage() {
  return <PriceList standalone />;
}
