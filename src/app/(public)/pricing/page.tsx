import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Services and packages",
  description: `Browse current nail services and packages at ${businessProfile.name}.`,
};

export default function PricingPage() {
  redirect("/services");
}
