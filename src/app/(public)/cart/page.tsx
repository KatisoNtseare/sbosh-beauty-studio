import { Suspense } from "react";
import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import BookingForm from "@/components/booking/BookingForm";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Booking cart",
  description: "Choose a preferred date and time and send an appointment request to Sbosh's Beauty Studio.",
};

export default function CartPage() {
  return <main className="mx-auto max-w-7xl px-6 md:px-16">
    <PageIntro eyebrow="Appointment request" title="Your booking request." lead="Choose a preferred date and available time. The studio will review your request and contact you about approval."/>
    <p className="pb-1 text-xs text-muted-text">All appointment times use {businessProfile.timezone}.</p>
    <Suspense fallback={<p className="py-10 text-sm text-muted-text">Preparing your booking cart…</p>}><BookingForm/></Suspense>
  </main>;
}
