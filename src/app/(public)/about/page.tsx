import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/layouts/PageIntro";
import { buttonStyles } from "@/lib/button";

export const metadata: Metadata = {
  title: "Our approach | SBOSH Beauty Studio",
  description: "Get to know the thoughtful, personal approach behind SBOSH Beauty Studio.",
};

const principles = [
  {
    title: "Care with intention",
    description: "A facial, a fresh set of nails or a quiet massage can be a small way to return to yourself.",
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
        eyebrow="The SBOSH approach"
        title="A studio for your pause."
        lead="Beauty and wellness can be more than the finished look. They can be a chance to slow down, feel cared for and leave with a little more ease."
      />

      <section aria-label="What matters to us" className="grid gap-0 border-b border-line md:grid-cols-3 md:gap-8">
        {principles.map((principle, index) => (
          <article key={principle.title} className="border-b border-line py-8 last:border-0 md:border-0 md:py-10">
            <p className="mb-6 font-display text-2xl italic text-rose">0{index + 1}</p>
            <h2 className="font-display text-3xl font-medium">{principle.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-ink/70">{principle.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-6 bg-olive px-6 py-8 text-cream md:flex-row md:items-center md:px-9">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/65">Make it your moment</p>
          <h2 className="font-display text-3xl font-medium md:text-4xl">Find the care that feels right.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/services" className={buttonStyles({ variant: "outline", className: "border-cream text-cream hover:bg-cream hover:text-olive" })}>Explore services</Link>
          <Link href="/book" className={buttonStyles({ className: "bg-cream text-olive hover:bg-white" })}>Book a visit</Link>
        </div>
      </section>
    </div>
  );
}
