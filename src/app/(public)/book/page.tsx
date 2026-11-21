import type { Metadata } from "next";
import BookingForm from "@/components/booking/BookingForm";
import PageIntro from "@/components/layouts/PageIntro";
import { Suspense } from "react";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: `Choose a nail service and preferred time, then call or WhatsApp ${businessProfile.name} to confirm pricing and availability.`,
};

export default function BookingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="Your time, your way"
        title="Book your visit."
        lead="Choose a nail service and a preferred time. Call or WhatsApp the studio to confirm pricing and availability."
      />
      <div className="mt-8">
        <Suspense fallback={<p className="py-10 text-sm text-ink/60">Preparing the booking form…</p>}><BookingForm /></Suspense>
      </div>
    </div>
  );
}
