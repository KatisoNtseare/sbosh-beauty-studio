"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiImage } from "react-icons/fi";

type StudioImage = { _id: string; name: string; image?: string };

export default function StudioGallery() {
  const [images, setImages] = useState<StudioImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/gallery")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load service photos.");
        const data = await response.json();
        setImages(data.images ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, []);

  if (error) return <p role="status" className="border-y border-soft-border py-8 text-sm text-dark-text/75">Studio photos are temporarily unavailable.</p>;
  if (!loaded) return <p aria-live="polite" className="border-y border-soft-border py-8 text-sm text-dark-text/70">Loading studio photos…</p>;
  if (!images.length) return <div className="border-y border-soft-border py-12 text-center">
    <FiImage aria-hidden="true" className="mx-auto size-9 text-brand-pink" />
    <h2 className="mt-3 font-display text-3xl font-semibold text-deep-berry">The gallery is waiting for its first photo</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-dark-text/75">There aren’t any service photos to show yet. In the meantime, browse the current services and packages.</p>
    <Link href="/services" className="mt-5 inline-flex min-h-11 items-center font-semibold text-deep-berry underline decoration-brand-pink underline-offset-4 hover:text-strong-pink">Explore services</Link>
  </div>;

  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {images.map((item) => <figure key={item._id} className="overflow-hidden border border-soft-border bg-surface">
      <div className="relative aspect-square bg-pale-blush"><Image src={item.image!} alt={item.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" /></div>
      <figcaption className="px-3 py-2 text-xs font-semibold text-deep-berry">{item.name}</figcaption>
    </figure>)}
  </div>;
}
