import Link from "next/link";
import { businessProfile } from "@/lib/brand";

export default function NotFound() {
  return <main className="grid min-h-[60vh] place-items-center bg-pale-blush px-5 py-16">
    <section className="w-full max-w-xl rounded-3xl border border-soft-border bg-surface p-8 text-center shadow-luxe sm:p-12">
      <p className="eyebrow text-brand-pink">404 · Page not found</p>
      <h1 className="mt-5 font-display text-5xl font-semibold text-deep-berry sm:text-6xl">This page wandered off.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-dark-text/75">That address doesn’t lead anywhere in {businessProfile.name}. Head back to the studio and find what you need.</p>
      <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-strong-pink px-7 text-sm font-semibold text-charcoal">Back to home</Link>
    </section>
  </main>;
}
