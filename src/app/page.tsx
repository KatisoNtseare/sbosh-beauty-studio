import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import BookingCta from "@/components/home/BookingCta";
import PriceList from "@/components/home/PriceList";
import StudioGallery from "@/components/gallery/StudioGallery";
import Link from "next/link";
import { studioContact } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <section className="bg-charcoal px-5 py-16 sm:px-6 md:px-12 md:py-24 xl:px-16">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[28px] border border-soft-border bg-surface p-8 shadow-luxe sm:grid-cols-[1fr_auto] sm:items-center md:p-14">
          <div>
            <p className="eyebrow text-brand-pink">A neighbourhood studio</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.02] text-deep-berry md:text-6xl">
              A little care, close to home.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-dark-text/80">
              Nail care can be more than the finished look. Find us in Bram Fischerville, Roodepoort.
            </p>
          </div>
          <Link
            href={studioContact.mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-strong-pink/60 px-8 text-[12px] font-semibold uppercase tracking-[0.16em] text-deep-berry transition-colors hover:border-strong-pink hover:bg-pale-blush"
          >
            Get directions
          </Link>
        </div>
      </section>
      <PriceList />
      <section id="gallery" className="scroll-mt-24 bg-pale-blush px-5 py-16 sm:px-6 md:px-12 md:py-24 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div><p className="eyebrow text-brand-pink">A closer look</p><h2 className="mt-3 font-display text-5xl font-semibold text-deep-berry md:text-7xl">Studio gallery</h2><p className="mt-3 max-w-xl text-sm leading-6 text-dark-text/75">A few details from the services we offer and the finishes we love.</p></div>
            <Link href="/gallery" className="inline-flex min-h-11 items-center font-semibold text-deep-berry underline decoration-brand-pink underline-offset-4 hover:text-strong-pink">View the gallery</Link>
          </div>
          <StudioGallery />
        </div>
      </section>
      <BookingCta />
    </>
  );
}
