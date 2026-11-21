"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type StudioImage = { _id: string; name: string; image?: string };

export default function StudioGallery() {
  const [images, setImages] = useState<StudioImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load service photos.");
        const data = await response.json();
        const services: StudioImage[] = data.services ?? [];
        const packages: StudioImage[] = data.packages ?? [];
        const configured = [...services, ...packages].filter((item) => item.image && item.image !== "/images/hero.jpg");
        setImages(configured);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  if (error) return <p role="status" className="border-y border-soft-border py-8 text-sm text-dark-text/75">Studio photos are temporarily unavailable.</p>;
  if (!loaded) return <p aria-live="polite" className="border-y border-soft-border py-8 text-sm text-dark-text/70">Loading studio photos…</p>;
  if (!images.length) return <div className="border-y border-soft-border py-10">
    <h2 className="font-display text-3xl font-semibold text-deep-berry">Photos coming soon</h2>
    <p className="mt-2 max-w-xl text-sm leading-6 text-dark-text/75">We don’t have service photos to show here yet. Browse the current menu to see available services and packages.</p>
    <Link href="/services" className="mt-5 inline-flex min-h-11 items-center font-semibold text-deep-berry underline decoration-brand-pink underline-offset-4 hover:text-strong-pink">Explore services</Link>
  </div>;

  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {images.map((item) => <figure key={item._id} className="overflow-hidden border border-soft-border bg-surface">
      <div className="relative aspect-square bg-pale-blush"><Image src={item.image!} alt={item.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" /></div>
      <figcaption className="px-3 py-2 text-xs font-semibold text-deep-berry">{item.name}</figcaption>
    </figure>)}
  </div>;
}
