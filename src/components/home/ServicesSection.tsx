"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Extra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN" };
type CatalogueItem = { _id: string; name: string; description: string; image: string; category: string; price?: number; priceConfirmed: boolean; durationMinutes?: number; isPackage?: boolean; serviceIds?: string[]; components?: { name: string }[]; extras?: Extra[] };
const categories = ["Acrylic Nail Sets", "Gel Nail Sets", "Pedicures", "Nail Care", "Additional Services", "Combination Packages"];
const formatPrice = (item: CatalogueItem) => item.priceConfirmed && typeof item.price === "number" ? `R${item.price}` : "Price to be confirmed";

function ServiceImage({ item }: { item: CatalogueItem }) {
  const [src, setSrc] = useState(item.image || "/images/hero.jpg");
  return <div className="relative aspect-[4/3] overflow-hidden bg-sand">
    <Image src={src} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" onError={() => setSrc("/images/hero.jpg")} />
    <span className="absolute bottom-3 left-3 bg-cream/90 px-3 py-1 text-[10px] font-medium text-ink/75">Sbosh’s Beauty Studio</span>
  </div>;
}

function ItemCard({ item }: { item: CatalogueItem }) {
  const bookable = Number.isInteger(item.durationMinutes) && Number(item.durationMinutes) > 0;
  return <article className="group overflow-hidden border border-line bg-cream transition-colors hover:border-olive/60">
    <ServiceImage item={item}/>
    <div className="p-5 md:p-6">
      <div className="flex items-start justify-between gap-3"><h3 className="font-display text-3xl font-medium leading-none">{item.name}</h3><span className="shrink-0 text-sm font-semibold text-olive">{formatPrice(item)}</span></div>
      <p className="mt-3 min-h-10 text-sm leading-6 text-ink/68">{item.description || "A considered treatment from the studio."}</p>
      {item.components?.length ? <p className="mt-3 border-l border-rose pl-3 text-xs leading-5 text-ink/65">Includes {item.components.map((component) => component.name).join(" + ")}</p> : null}
      <div className="mt-4 flex min-h-9 items-center justify-between gap-3 border-t border-line pt-3 text-xs text-ink/60">
        <span>{bookable ? `${item.durationMinutes} minutes` : "Appointment time to be confirmed"}</span>
        {bookable ? <Link href={`/${item.isPackage ? "cart?package" : "cart?service"}=${item._id}`} className="font-semibold text-olive underline decoration-olive/40 underline-offset-4">Book now</Link> : <span className="text-right">Call the studio to request</span>}
      </div>
    </div>
  </article>;
}

export default function ServicesSection() {
  const [services, setServices] = useState<CatalogueItem[]>([]);
  const [packages, setPackages] = useState<CatalogueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/services").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "The service menu could not be loaded."); setServices(result.services ?? []); setPackages(result.packages ?? []); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoaded(true)); }, []);
  const extras = useMemo(() => {
    const unique = new Map<string, Extra>();
    for (const service of services) for (const extra of service.extras ?? []) unique.set(`${extra.key}:${extra.unitPrice}:${extra.method}`, extra);
    return [...unique.values()];
  }, [services]);
  const knownCategories = new Set(categories.filter((title) => title !== "Combination Packages"));
  const extraCategories = [...new Set(services.map((service) => service.category).filter((category) => category && !knownCategories.has(category)))].map((title) => ({ title, items: services.filter((service) => service.category === title) }));
  const sections: { title: string; items: CatalogueItem[] }[] = [
    ...categories.filter((title) => title !== "Combination Packages").map((title) => ({ title, items: services.filter((service) => service.category === title) })),
    ...extraCategories,
    { title: "Combination Packages", items: packages },
  ];

  return <section id="services" className="scroll-mt-24 border-y border-line bg-sand/55 px-6 py-16 md:px-16 md:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="mb-9 grid gap-5 md:grid-cols-[1fr_300px] md:items-end md:gap-10"><div><p className="mb-4 flex items-center gap-3 text-[11px] font-semibold text-olive"><span className="h-px w-8 bg-rose"/>The service menu</p><h2 className="font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">A little care, <span className="italic text-olive">your way.</span></h2></div><p className="max-w-sm text-sm leading-6 text-ink/70">Choose a finish, a small refresh or a paired set. Every request is reviewed by the studio before it is confirmed.</p></div>
      <nav aria-label="Service categories" className="sticky top-[4.25rem] z-20 -mx-6 mb-12 flex gap-2 overflow-x-auto border-y border-line bg-cream/95 px-6 py-3 backdrop-blur md:top-[5rem] md:mx-0 md:flex-wrap md:border-0 md:bg-transparent md:px-0 md:py-0">
        {sections.map((section) => <a key={section.title} href={`#${section.title.toLowerCase().replaceAll(" ", "-")}`} className="shrink-0 rounded-full border border-line bg-cream px-4 py-2 text-xs text-ink/75 transition-colors hover:border-olive hover:text-olive">{section.title}</a>)}
        {extras.length > 0 && <a href="#nail-art-extras" className="shrink-0 rounded-full border border-line bg-cream px-4 py-2 text-xs text-ink/75 transition-colors hover:border-olive hover:text-olive">Nail Art & Extras</a>}
      </nav>
      {error ? <p role="alert" className="border-y border-rose/50 py-6 text-sm">{error} Please call the studio to book.</p> : !loaded ? <p aria-live="polite" className="border-y border-line py-6 text-sm text-ink/65">Loading the service menu…</p> : <>
        {sections.map((section) => <section id={section.title.toLowerCase().replaceAll(" ", "-")} key={section.title} className="scroll-mt-36 border-t border-line py-10 md:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h3 className="font-display text-4xl md:text-5xl">{section.title}</h3><span className="text-xs text-ink/55">{section.items.length} {section.items.length === 1 ? "service" : "services"}</span></div>
          {section.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{section.items.map((item) => <ItemCard key={item._id} item={item}/>)}</div> : <p className="border-l border-rose py-2 pl-4 text-sm text-ink/60">The studio is updating this part of the menu. Please check back soon.</p>}
        </section>)}
        <section id="nail-art-extras" className="scroll-mt-36 border-y border-line bg-cream px-5 py-8 md:px-8"><div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-start"><div><p className="text-[11px] font-semibold text-olive">Add a finishing detail</p><h3 className="mt-2 font-display text-4xl md:text-5xl">Nail art & extras</h3><p className="mt-3 max-w-xl text-sm leading-6 text-ink/65">Optional details can be selected with compatible services when you request an appointment.</p></div>{extras.length ? <dl className="divide-y divide-line">{extras.map((extra) => <div key={extra.key} className="flex items-center justify-between gap-4 py-3 text-sm"><dt>{extra.name}<span className="mt-1 block text-xs text-ink/55">{extra.method === "PER_NAIL" ? "Charged per nail" : "Charged per design"}</span></dt><dd className="shrink-0 font-semibold text-olive">R{extra.unitPrice} {extra.method === "PER_NAIL" ? "/ nail" : "/ design"}</dd></div>)}</dl> : <p className="text-sm text-ink/60">Extras are being configured by the studio.</p>}</div></section>
      </>}
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 text-xs text-ink/60"><span>Need help choosing? The studio can help before you request.</span><Link href="/cart" className="font-semibold text-olive underline decoration-olive/40 underline-offset-4">Start an appointment request</Link></div>
    </div>
  </section>;
}
