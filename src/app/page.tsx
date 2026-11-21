import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import PricingGallery from "@/components/home/PricingGallery";
import BookingCta from "@/components/home/BookingCta";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <PricingGallery />
      <BookingCta />
    </>
  );
}