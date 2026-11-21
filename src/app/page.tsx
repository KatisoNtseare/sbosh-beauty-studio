import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import NailMenuAndMoodboard from "@/components/home/NailMenuAndMoodboard";
import BookingCta from "@/components/home/BookingCta";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <NailMenuAndMoodboard />
      <BookingCta />
    </>
  );
}
