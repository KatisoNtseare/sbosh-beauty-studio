import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { businessProfile } from "@/lib/brand";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";
import { studioContact } from "@/lib/data";

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

      <section aria-label="What matters to us" className="grid gap-0 border-b border-line md:grid-cols-3 md:gap-8">
        {principles.map((principle) => (
          <article key={principle.title} className="border-b border-line py-8 last:border-0 md:border-0 md:py-10">
            <p aria-hidden="true" className="mb-6 font-display text-2xl text-rose">✳</p>
            <h2 className="font-display text-3xl font-medium">{principle.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-ink/70">{principle.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-8 bg-olive px-6 py-8 text-cream md:grid-cols-[1fr_auto] md:items-center md:px-9">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-cream/65">Visit the studio</p>
          <h2 className="font-display text-3xl font-medium md:text-4xl">Come see us in Roodepoort.</h2>
          <a href={studioContact.mapHref} target="_blank" rel="noreferrer" className="mt-3 block max-w-md text-sm leading-6 text-cream/80 underline decoration-cream/35 underline-offset-4 hover:text-white">
            {studioContact.address}
          </a>
          <a href={studioContact.phoneHref} className="mt-2 inline-block text-sm text-cream/80 hover:text-white">{studioContact.phone}</a>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={studioContact.phoneHref} className={cn(buttonStyles({ variant: "outline" }), "border-cream text-cream hover:bg-cream hover:text-olive")}>Call the studio</a>
          <Link href="/cart" className={cn(buttonStyles(), "bg-cream text-olive hover:bg-white")}>Send a booking request</Link>
        </div>
      </section>
    </div>
  );
}
