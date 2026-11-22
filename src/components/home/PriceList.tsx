"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiTag } from "react-icons/fi";

type Extra = { key: string; name: string; unitPrice: number; method: "PER_NAIL" | "PER_DESIGN"; componentName?: string };
type PriceItem = {
  _id: string;
  name: string;
  category: string;
  price?: number | null;
  priceConfirmed: boolean;
  isPackage?: boolean;
  components?: { name: string }[];
  extras?: Extra[];
};

function priceFor(item: PriceItem) {
  return typeof item.price === "number" ? `R${item.price}` : "";
}

function CategoryCard({ category, items }: { category: string; items: PriceItem[] }) {
  return <section className="rounded-3xl border border-white/60 bg-brand-white/78 p-5 shadow-sm backdrop-blur-lg sm:p-6">
    <h3 className="inline-flex rounded-full bg-soft-pink/70 px-4 py-2 font-display text-2xl font-semibold text-deep-berry">{category}</h3>
    <dl className="mt-3 divide-y divide-soft-border/80">
      {items.map((item) => <div key={item._id} className="py-4">
        <div className="flex items-start justify-between gap-5">
          <dt className="font-medium text-dark-text">{item.name}</dt>
          <dd className="shrink-0 text-right text-sm font-semibold text-deep-berry">{priceFor(item)}</dd>
        </div>
        {item.components?.length ? <p className="mt-1 text-xs leading-5 text-dark-text/70">Includes {item.components.map((component) => component.name).join(" + ")}</p> : null}
        {item.extras?.map((extra) => <p key={extra.key} className="mt-2 flex justify-between gap-4 pl-3 text-xs text-dark-text/75"><span>{extra.name}{extra.componentName ? ` · ${extra.componentName}` : ""} <span className="text-dark-text/60">({extra.method === "PER_NAIL" ? "per nail" : "per design"})</span></span><span className="shrink-0 font-semibold text-deep-berry">R{extra.unitPrice}</span></p>)}
      </div>)}
    </dl>
  </section>;
}

export default function PriceList({ standalone = false }: { standalone?: boolean }) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load prices.");
        const result = await response.json();
        setItems([...(result.services ?? []), ...(result.packages ?? [])]);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  const categories = [...new Set(items.map((item) => item.category || "Services"))];
  const sectionClass = standalone
    ? "relative isolate overflow-hidden px-5 py-12 sm:px-6 md:px-12 md:py-16 xl:px-16"
    : "scroll-mt-24 relative isolate overflow-hidden px-5 py-16 sm:px-6 md:px-12 md:py-24 xl:px-16";

  return <section id="price-list" className={sectionClass} style={{ backgroundImage: "linear-gradient(120deg, rgb(74 36 56 / 0.68), rgb(162 77 105 / 0.36)), url('https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=2400&q=85')", backgroundSize: "cover", backgroundPosition: "center 42%" }}>
    <div className={`${standalone ? "" : "mx-auto"} max-w-7xl`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5 rounded-[1.75rem] border border-white/60 bg-brand-white/75 p-6 shadow-luxe backdrop-blur-lg sm:p-8 md:p-10">
        <div>
          <p className="eyebrow text-brand-pink">A little treat, at a clear price</p>
          <h2 className="mt-3 font-display text-5xl font-semibold leading-[0.95] text-deep-berry md:text-7xl">The price list</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-dark-text/75">Find your next favourite finish. These prices come from the studio’s current menu; optional extras are shown separately.</p>
        </div>
        {!standalone && <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-full bg-strong-pink px-6 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-brand-pink">See full price list</Link>}
      </div>

      {error ? <p role="status" className="rounded-3xl border border-white/60 bg-brand-white/80 px-6 py-8 text-sm text-dark-text/75 shadow-sm backdrop-blur-lg">The price list is temporarily unavailable. Please try again shortly.</p>
        : !loaded ? <p aria-live="polite" className="rounded-3xl border border-white/60 bg-brand-white/80 px-6 py-8 text-sm text-dark-text/70 shadow-sm backdrop-blur-lg">Loading current prices…</p>
          : !items.length ? <div className="rounded-3xl border border-white/60 bg-brand-white/80 py-10 text-center shadow-sm backdrop-blur-lg">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-soft-pink text-deep-berry"><FiTag aria-hidden="true" className="size-5" /></span>
            <p className="mt-3 font-display text-2xl font-semibold text-deep-berry">Prices are being prepared</p>
            <p className="mt-1 text-sm text-dark-text/70">Please check back soon or contact the studio for current pricing.</p>
          </div>
            : <>
              <div className="space-y-4 lg:hidden">
                {categories.flatMap((category) => {
                  const group = items.filter((item) => (item.category || "Services") === category);
                  if (category !== "Combination Packages" || group.length <= 4) return [<CategoryCard key={category} category={category} items={group} />];
                  const midpoint = Math.ceil(group.length / 2);
                  return [
                    <CategoryCard key={`${category}-first`} category={category} items={group.slice(0, midpoint)} />,
                    <CategoryCard key={`${category}-second`} category="More packages" items={group.slice(midpoint)} />,
                  ];
                })}
              </div>
              <div className="hidden gap-4 lg:grid lg:grid-cols-2 lg:items-start">
                {[0, 1].map((column) => <div key={column} className="space-y-4">
                  {categories.flatMap((category) => {
                    const group = items.filter((item) => (item.category || "Services") === category);
                    if (category !== "Combination Packages" || group.length <= 4) return [{ key: category, title: category, items: group }];
                    const midpoint = Math.ceil(group.length / 2);
                    return [
                      { key: `${category}-first`, title: category, items: group.slice(0, midpoint) },
                      { key: `${category}-second`, title: "More packages", items: group.slice(midpoint) },
                    ];
                  }).filter((_, index) => index % 2 === column).map((group) => <CategoryCard key={group.key} category={group.title} items={group.items} />)}
                </div>)}
              </div>
            </>}
      <p className="mt-3 text-right text-[10px] text-white/90">Photo by <a href="https://unsplash.com/photos/a-woman-getting-her-nails-done-at-a-nail-salon-gb6gtiTZKB8" target="_blank" rel="noreferrer" className="underline underline-offset-2">Giorgio Trovato on Unsplash</a></p>
    </div>
  </section>;
}
