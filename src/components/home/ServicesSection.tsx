"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiEye, FiShoppingBag } from "react-icons/fi";
import { addCartEntry } from "@/lib/cart";

type Extra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN" };
type CatalogueItem = { _id: string; name: string; description: string; image: string; category: string; price?: number; priceConfirmed: boolean; isPackage?: boolean; serviceIds?: string[]; components?: { name: string }[]; extras?: Extra[] };
const categories = ["Acrylic Nail Sets", "Gel Nail Sets", "Pedicures", "Nail Care", "Additional Services", "Combination Packages"];
const formatPrice = (item: CatalogueItem) => item.priceConfirmed && typeof item.price === "number" ? `R${item.price}` : "Price to be confirmed";

function ServiceImage({ item }: { item: CatalogueItem }) {
  const [src, setSrc] = useState(item.image || "/images/hero.jpg");
  return <div className="relative aspect-[4/3] overflow-hidden bg-soft-pink">
    <Image src={src} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" onError={() => setSrc("/images/hero.jpg")} />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-soft-pink/10 opacity-70" />
    <span className="absolute bottom-3 left-3 rounded-full border border-silver/70 bg-surface/90 px-3 py-1 text-[10px] font-semibold text-deep-berry shadow-sm">{item.isPackage ? "Studio package" : "Nail care"}</span>
  </div>;
}

function ItemCard({ item, onBook, onView }: { item: CatalogueItem; onBook: (item: CatalogueItem) => void; onView: (item: CatalogueItem) => void }) {
  return <article className={`group flex h-full flex-col overflow-hidden rounded-[22px] border bg-surface shadow-[0_1px_2px_rgb(74_36_56/0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-luxe ${item.isPackage ? "border-rose-gold/60 bg-pale-blush" : "border-soft-border hover:border-rose-gold"}`}>
    <ServiceImage item={item}/>
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1"><h3 className="min-w-0 flex-1 basis-20 font-display text-xl font-semibold leading-[1.05] text-deep-berry sm:text-2xl">{item.name}</h3><span className="max-w-full text-right text-[11px] font-bold leading-4 text-deep-berry sm:text-xs">{formatPrice(item)}</span></div>
      <p className="mt-2 line-clamp-3 min-h-[3.5rem] text-xs leading-[1.2rem] text-dark-text/85 sm:text-[13px]">{item.description || "A considered treatment from the studio."}</p>
      {item.components?.length ? <p className="mt-2 line-clamp-2 border-l-2 border-soft-pink pl-2.5 text-[11px] leading-4 text-deep-berry sm:mt-3 sm:pl-3 sm:text-xs sm:leading-5">Includes {item.components.map((component) => component.name).join(" + ")}</p> : null}
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-pale-blush pt-3">
        <button type="button" onClick={() => onView(item)} aria-label={`View more details for ${item.name}`} title="View more" className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-brand-pink/35 bg-surface px-1.5 text-[11px] font-semibold text-deep-berry transition-colors hover:border-brand-pink hover:bg-pale-blush focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-berry sm:gap-2 sm:px-2 sm:text-xs">
          <FiEye aria-hidden="true" className="size-4 shrink-0" />
          <span>More</span>
        </button>
        <button type="button" onClick={() => onBook(item)} aria-label={`Book ${item.isPackage ? "package" : "service"}: ${item.name}`} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-strong-pink px-1.5 text-[11px] font-semibold text-charcoal transition-colors hover:bg-raised-surface hover:text-silver focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-berry sm:gap-2 sm:px-2 sm:text-xs">
          <FiShoppingBag aria-hidden="true" className="size-4 shrink-0" />
          <span>Book</span>
        </button>
      </div>
    </div>
  </article>;
}

function ProductDetails({ item, onClose, onBook }: { item: CatalogueItem; onClose: () => void; onBook: (item: CatalogueItem) => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  const image = item.image || "/images/hero.jpg";
  function keepFocusInside(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div role="dialog" aria-modal="true" aria-label={`${item.name} details`} onKeyDown={keepFocusInside} className="fixed inset-0 z-[100] h-dvh overflow-y-auto bg-surface text-dark-text">
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-pale-blush bg-surface/95 px-4 backdrop-blur sm:px-7">
      <p className="truncate pr-4 text-xs font-semibold text-deep-berry">{item.isPackage ? "Studio package" : item.category}</p>
      <button type="button" autoFocus onClick={onClose} aria-label="Close product details" className="grid size-10 shrink-0 place-items-center rounded-full border border-pale-blush bg-surface text-2xl leading-none text-deep-berry transition-colors hover:bg-pale-blush">×</button>
    </div>
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[38vh] bg-soft-pink sm:min-h-[52vh] lg:min-h-full">
        <Image src={image} alt={item.name} fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
      </div>
      <div className="flex flex-col px-5 py-7 sm:px-9 sm:py-10 lg:justify-center lg:px-12 xl:px-16">
        <p className="text-xs font-semibold text-deep-berry">{item.isPackage ? "A little something extra" : item.category || "Nail care"}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-deep-berry sm:text-5xl lg:text-6xl">{item.name}</h2>
        <p className="mt-4 text-xl font-bold text-deep-berry">{formatPrice(item)}</p>
        <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 text-dark-text/90 sm:text-base">{item.description || "A considered treatment from the studio."}</p>
        {item.components?.length ? <div className="mt-7 rounded-2xl border border-pale-blush bg-soft-pink p-5"><h3 className="text-sm font-semibold text-deep-berry">Included in this package</h3><ul className="mt-3 space-y-2 text-sm text-dark-text/90">{item.components.map((component, index) => <li key={`${component.name}-${index}`} className="flex gap-2"><span aria-hidden="true" className="text-deep-berry">✦</span>{component.name}</li>)}</ul></div> : null}
        {item.extras?.length ? <div className="mt-6"><h3 className="text-sm font-semibold text-deep-berry">Optional extras</h3><ul className="mt-2 space-y-2 text-sm text-dark-text/85">{item.extras.map((extra) => <li key={extra.key} className="flex flex-wrap justify-between gap-2"><span>{extra.name} <span className="text-dark-text/70">({extra.method === "PER_NAIL" ? "per nail" : "per design"})</span></span><span className="font-semibold text-deep-berry">R{extra.unitPrice}</span></li>)}</ul></div> : null}
        <p className="mt-7 text-xs leading-5 text-dark-text/75">Final prices and appointment times follow the studio’s current booking details.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => { onClose(); onBook(item); }} className="min-h-12 rounded-xl bg-strong-pink px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-raised-surface hover:text-silver">{item.isPackage ? "Book this package" : "Book this service"}</button>
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-brand-pink/35 bg-surface px-5 text-sm font-semibold text-deep-berry transition-colors hover:bg-pale-blush">Back to services</button>
        </div>
      </div>
    </div>
  </div>;
}

export default function ServicesSection() {
  const router = useRouter();
  const [services, setServices] = useState<CatalogueItem[]>([]);
  const [packages, setPackages] = useState<CatalogueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<CatalogueItem | null>(null);
  const closeDetails = useCallback(() => setSelectedItem(null), []);
  useEffect(() => { fetch("/api/services").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "The service menu could not be loaded."); setServices(result.services ?? []); setPackages(result.packages ?? []); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoaded(true)); }, []);
  useEffect(() => {
    if (!loaded || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }));
  }, [loaded]);
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

  function book(item: CatalogueItem) {
    const result = addCartEntry({ id: item._id, kind: item.isPackage ? "package" : "service" });
    if (result.added) toast.success(`${item.name} added to your booking.`);
    else toast.info(`${item.name} is already in your booking.`);
    router.push("/cart");
  }

  return <section id="services" className="scroll-mt-24 bg-pale-blush px-5 py-16 sm:px-6 md:px-12 md:py-24 xl:px-16">
    <div className="mx-auto max-w-7xl">
      <div className="mb-9 grid gap-5 md:grid-cols-[1fr_300px] md:items-end md:gap-10"><div><p className="mb-4 flex items-center gap-3 text-[11px] font-semibold text-deep-berry"><span className="h-px w-8 bg-soft-pink"/>Find your finish</p><h2 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-deep-berry md:text-7xl">A little colour, <span className="italic text-deep-berry">a lot of you.</span></h2></div><p className="max-w-sm text-sm leading-6 text-dark-text/75">Explore the current services and pairings. Prices and availability come from the studio’s live catalogue.</p></div>
      <nav aria-label="Service categories" className="sticky top-[4.25rem] z-20 -mx-5 mb-12 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto border-y border-pale-blush bg-brand-white/95 px-5 py-5 backdrop-blur md:top-[5rem] md:mx-0 md:flex-wrap md:snap-none md:gap-x-4 md:gap-y-3 md:border-0 md:bg-transparent md:px-0 md:py-4">
        {sections.map((section) => <a key={section.title} href={`#${section.title.toLowerCase().replaceAll(" ", "-")}`} className="shrink-0 snap-start whitespace-nowrap rounded-full border border-pale-blush bg-surface px-5 py-3 text-[13px] font-medium text-deep-berry shadow-sm transition-colors hover:border-brand-pink hover:bg-pale-blush">{section.title}</a>)}
        {extras.length > 0 && <a href="#nail-art-extras" className="shrink-0 snap-start whitespace-nowrap rounded-full border border-pale-blush bg-surface px-5 py-3 text-[13px] font-medium text-deep-berry shadow-sm transition-colors hover:border-brand-pink hover:bg-pale-blush">Nail Art & Extras</a>}
      </nav>
      {error ? <p role="alert" className="border-y border-error/50 py-6 text-sm">{error}</p> : !loaded ? <p aria-live="polite" className="border-y border-soft-border py-6 text-sm text-dark-text/70">Loading the service menu…</p> : <>
        {sections.map((section) => <section id={section.title.toLowerCase().replaceAll(" ", "-")} key={section.title} className={`scroll-mt-36 border-t py-8 md:py-10 ${section.title === "Combination Packages" ? "border-brand-pink/35" : "border-pale-blush"}`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h3 className="font-display text-4xl font-semibold text-deep-berry md:text-5xl">{section.title}</h3><span className="rounded-full bg-surface px-3 py-1 text-xs text-deep-berry/75">{section.items.length} {section.items.length === 1 ? "service" : "services"}</span></div>
          {section.items.length ? <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{section.items.map((item) => <ItemCard key={item._id} item={item} onBook={book} onView={setSelectedItem}/>)}</div> : <p className="rounded-xl border border-dashed border-brand-pink/35 bg-surface/70 px-4 py-3 text-sm text-dark-text/70">The studio is updating this part of the menu. Please check back soon.</p>}
        </section>)}
        <section id="nail-art-extras" className="scroll-mt-36 rounded-3xl border border-pale-blush bg-surface px-5 py-7 shadow-sm md:px-8"><div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-start"><div><p className="text-xs font-semibold text-deep-berry">Add a finishing detail</p><h3 className="mt-2 font-display text-4xl font-semibold text-deep-berry md:text-5xl">Nail art & extras</h3><p className="mt-3 max-w-xl text-sm leading-6 text-dark-text/70">Optional details can be selected with compatible services when you request an appointment.</p></div>{extras.length ? <dl className="divide-y divide-pale-blush">{extras.map((extra) => <div key={extra.key} className="flex items-center justify-between gap-4 py-3 text-sm"><dt>{extra.name}<span className="mt-1 block text-xs text-dark-text/70">{extra.method === "PER_NAIL" ? "Charged per nail" : "Charged per design"}</span></dt><dd className="shrink-0 font-semibold text-deep-berry">R{extra.unitPrice} {extra.method === "PER_NAIL" ? "/ nail" : "/ design"}</dd></div>)}</dl> : <p className="text-sm text-dark-text/70">Extras are being configured by the studio.</p>}</div></section>
      </>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-dark-text/70"><span>Need help choosing? Contact the studio before booking.</span><Link href="/cart" className="font-semibold text-deep-berry underline decoration-brand-pink/40 underline-offset-4">Start an appointment request</Link></div>
    </div>
    {selectedItem && <ProductDetails item={selectedItem} onClose={closeDetails} onBook={book}/>}
  </section>;
}
