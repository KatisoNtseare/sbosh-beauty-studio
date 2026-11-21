"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Service = { _id: string; name: string; description: string; image: string; priceLabel: string; minimumPrice?: number; maximumPrice?: number;  };

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/services").then((r) => r.json()).then((d) => setServices(d.services ?? [])).catch(() => setServices([])).finally(() => setLoaded(true)); }, []);
  return <section id="services" className="scroll-mt-24 border-y border-line bg-sand/65 px-6 py-20 md:px-16 md:py-28">
    <div className="mx-auto max-w-7xl"><div className="mb-12 grid gap-5 md:grid-cols-[1fr_300px] md:items-end md:gap-10"><div><p className="mb-4 flex items-center gap-3 text-[11px] font-semibold text-olive"><span className="h-px w-8 bg-rose"/>Thoughtful nail care</p><h2 className="font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl">Find your <span className="italic text-olive">ritual.</span></h2></div><p className="max-w-sm text-sm leading-6 text-ink/70">A few ways to reset and feel refreshed. Choose what you need today; there’s no one way to feel good.</p></div>
      {services.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => { const price = service.priceLabel || (service.minimumPrice != null && service.maximumPrice != null ? `R${service.minimumPrice}–R${service.maximumPrice}` : service.minimumPrice != null ? `From R${service.minimumPrice}` : service.maximumPrice != null ? `Up to R${service.maximumPrice}` : "Contact for pricing"); return <article key={service._id} className="overflow-hidden border border-line bg-cream"><div className="relative aspect-[4/3] bg-sand"><Image src={service.image || "/images/hero.jpg"} alt={service.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover"/></div><div className="p-5"><h3 className="font-display text-3xl font-medium">{service.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-ink/65">{service.description || "Ask the studio about this treatment and the right option for you."}</p><div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4 text-xs"><span>{price}</span><Link href={`/cart?service=${service._id}`} className="font-semibold text-olive underline decoration-olive/40 underline-offset-4">Book now</Link></div></div></article>;})}</div> : <p className="border-y border-line py-8 text-sm text-ink/65">{loaded ? "Our service menu is temporarily unavailable. Please contact the studio to book." : "Loading the service menu…"}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-ink/60"><span>Not sure where to begin? We can help you choose.</span><Link href="/services" className="font-semibold text-olive underline decoration-olive/40 underline-offset-4">See service details</Link></div>
    </div></section>;
}
