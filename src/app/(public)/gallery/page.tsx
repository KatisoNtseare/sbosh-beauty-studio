import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import StudioGallery from "@/components/gallery/StudioGallery";
import { businessProfile } from "@/lib/brand";
import { StudioDirectionsLink } from "@/components/site/SiteContact";

export const metadata: Metadata = {
  title: "Studio photos",
  description: `Service photos and studio information for ${businessProfile.name}.`,
};

export default function GalleryPage() {
  return <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:px-12 md:py-16 xl:px-16">
    <PageIntro eyebrow="Our studio" title="Service photos" lead="Browse photos configured for the studio’s current services." />
    <section className="mt-8"><StudioGallery /></section>
    <section className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-soft-border pt-6">
      <div><h2 className="font-display text-2xl font-semibold text-deep-berry">Find us in Bram Fischerville</h2><address className="mt-1 not-italic text-sm leading-6 text-dark-text/75">{businessProfile.contact.address}</address></div>
      <StudioDirectionsLink className="inline-flex min-h-11 items-center font-semibold text-deep-berry underline decoration-brand-pink underline-offset-4 hover:text-strong-pink">Get directions</StudioDirectionsLink>
    </section>
  </div>;
}
