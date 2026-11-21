import Link from "next/link";
import { CURRENCY, pricedTreatments } from "@/lib/data";

const gallery = [
  { label: "Brows", bg: "bg-[#d9be9c]" },
  { label: "Lashes", bg: "bg-[#cba98a]" },
  { label: "Nails", bg: "bg-[#e3cdb3]" },
  { label: "Treatment room", bg: "bg-[#c9b196]" },
];

export default function PricingGallery() {
  return (
    <section className="grid gap-16 bg-sand px-6 py-24 md:grid-cols-2 md:px-16">
      <div id="pricing" className="scroll-mt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Transparent pricing
        </span>
        <h2 className="mb-6 mt-3 font-display text-5xl font-medium leading-tight">
          Price list
        </h2>

        <dl>
          {pricedTreatments.map((t) => (
            <div
              key={t.name}
              className="flex justify-between gap-4 border-b border-line py-4"
            >
              <dt>{t.name}</dt>
              <dd className="font-semibold">
                {CURRENCY}
                {t.price}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-sm">
          Need something else?{" "}
          <Link href="/book" className="text-gold underline">
            Contact us for more details
          </Link>
        </p>
      </div>

      <div id="gallery" className="scroll-mt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Our work
        </span>
        <h2 className="mb-6 mt-3 font-display text-5xl font-medium leading-tight">
          Gallery
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {gallery.map((g) => (
            <div
              key={g.label}
              className={`flex min-h-50 items-end rounded-[18px] p-4 text-xs uppercase tracking-[0.12em] text-[#5a4630] ${g.bg}`}
            >
              [{g.label}]
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}