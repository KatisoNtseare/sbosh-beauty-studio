import type { Metadata } from "next";
import BookingForm from "@/components/booking/BookingForm";
import PageIntro from "@/components/layouts/PageIntro";

export const metadata: Metadata = {
  title: "Book an appointment | SBOSH Beauty Studio",
  description:
    "Choose your treatment, preferred date and time, then share your contact details with SBOSH Beauty Studio.",
};

export default function BookingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="Your time, your way"
        title="Book your visit."
        lead="Choose a treatment, find a date and time, and leave us your details."
      />
      <div className="mt-8">
        <BookingForm />
      </div>
    </div>
  );
}
