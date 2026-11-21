import Link from "next/link";
import { buttonStyles } from "@/lib/button";

export default function Hero() {
  return (
    <section className="grid min-h-[620px] md:grid-cols-2">
      <div className="flex flex-col justify-center gap-6 px-6 py-20 md:px-16">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Beauty &amp; wellness studio
        </span>
        <h1 className="font-display text-5xl font-medium leading-[1.02] md:text-7xl">
          Your ultimate beauty &amp; wellness experience
        </h1>
        <p className="max-w-md text-lg leading-relaxed">
          Facials, brows, lashes, nails and massage in one calm, beautifully
          kept space. Book online in under a minute.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <Link href="/book" className={buttonStyles()}>
            Book appointment
          </Link>
          <Link href="/#services" className={buttonStyles({ variant: "outline" })}>
            Explore services
          </Link>
        </div>
      </div>

      {/* Replace with: <Image src="/hero.jpg" alt="..." fill className="object-cover" priority />
          inside a relative container, once you add the photo to /public */}
      <div
        role="img"
        aria-label="Studio reception with arches and florals"
        className="flex min-h-[420px] items-end bg-linear-to-br from-[#e9d8c3] to-[#c9a67a] p-4 text-xs uppercase tracking-[0.12em] text-[#5a4630]"
      >
        [Studio photo]
      </div>
    </section>
  );
}