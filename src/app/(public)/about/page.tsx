import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { businessProfile } from "@/lib/brand";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";
import { StudioContactActions, StudioDirectionsLink } from "@/components/site/SiteContact";

export const metadata: Metadata = {
  title: "Our approach",
  description: `Manicure, gel nails, overlay, nail repair, and buff & shine at ${businessProfile.name} in Bram Fischerville, Roodepoort.`,
};

const principles = [
  {
    title: "Care with intention",
    description: "A manicure, a fresh gel set or a simple buff and shine can be a small way to return to yourself.",
  },
  {
    title: "Your style comes first",
    description: "Beauty is personal. Bring a reference, ask a question or keep things simple. Your visit is yours.",
  },
  {
    title: "Room to slow down",
    description: "A little breathing space can change how the whole day feels. Make your appointment a pause in it.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="Our approach"
        title="A studio for your pause."
        lead="Nail care can be more than the finished look. It can be a chance to slow down, feel cared for and leave with a little more ease."
      />

      <section aria-label="What matters to us" className="mt-9 grid divide-y divide-soft-border border-y border-soft-border md:mt-12 md:grid-cols-3 md:divide-x md:divide-y-0">
        {principles.map((principle) => (
          <article key={principle.title} className="py-5 md:px-6 md:py-7 first:md:pl-0 last:md:pr-0">
            <h2 className="font-display text-3xl font-semibold text-deep-berry">{principle.title}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-dark-text/75">{principle.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 bg-charcoal px-6 py-8 text-silver md:grid-cols-[1fr_auto] md:items-center md:px-9">
        <div>
          <p className="mb-2 text-xs font-semibold text-pale-blush">Visit the studio</p>
          <h2 className="font-display text-3xl font-medium md:text-4xl">Come see us in Roodepoort.</h2>
          <StudioDirectionsLink className="mt-3 block max-w-md text-sm leading-6 text-silver/85 underline decoration-soft-pink/60 underline-offset-4 hover:text-pale-blush">{businessProfile.contact.address}</StudioDirectionsLink>
          <div className="mt-3"><StudioContactActions dark/></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <StudioContactActions dark showCallButton showDetails={false}/>
          <Link href="/services" className={cn(buttonStyles(), "bg-strong-pink text-charcoal hover:bg-raised-surface hover:text-silver")}>Book an appointment</Link>
        </div>
      </section>
    </div>
  );
}
