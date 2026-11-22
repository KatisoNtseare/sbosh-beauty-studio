import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Access restricted", robots: { index: false, follow: false } };

export default function UnauthorizedPage() {
  return <main className="grid min-h-[60vh] place-items-center bg-pale-blush px-5 py-16">
    <section className="w-full max-w-xl rounded-3xl border border-soft-border bg-surface p-8 text-center shadow-luxe sm:p-12">
      <p className="eyebrow text-brand-pink">401 · Access restricted</p>
      <h1 className="mt-5 font-display text-5xl font-semibold text-deep-berry sm:text-6xl">This area is private.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-dark-text/75">Sign in with an authorised studio account to continue.</p>
      <Link href="/admin" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-strong-pink px-7 text-sm font-semibold text-charcoal">Go to admin sign in</Link>
    </section>
  </main>;
}
