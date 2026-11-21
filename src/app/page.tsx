import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import BookingCta from "@/components/home/BookingCta";
import Link from "next/link";
import { studioContact } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <section className="border-y border-soft-border bg-pale-blush px-5 py-12 sm:px-6 md:px-12 md:py-16 xl:px-16">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-deep-berry">A neighbourhood studio</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-deep-berry sm:text-4xl">A little care, close to home.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-text/80">Nail care can be more than the finished look. Find us in Bram Fischerville, Roodepoort.</p>
          </div>
          <Link href={studioContact.mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-deep-berry underline decoration-brand-pink underline-offset-4 hover:text-strong-pink">Get directions</Link>
        </div>
      </section>
      <BookingCta />
    </>
  );
}
