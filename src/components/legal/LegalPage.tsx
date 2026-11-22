import Link from "next/link";

export type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };

export default function LegalPage({ title, intro, sections, updated = "22 November 2026" }: { title: string; intro: string; sections: LegalSection[]; updated?: string }) {
  return <main className="bg-pale-blush px-4 py-10 sm:px-6 sm:py-14 md:px-12 md:py-20">
    <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-soft-border bg-surface shadow-luxe">
      <header className="border-b border-soft-border bg-soft-pink/50 px-6 py-8 sm:px-10 sm:py-11">
        <p className="eyebrow text-brand-pink">Sbosh’s Beauty Studio</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-deep-berry sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-dark-text/75">{intro}</p>
        <p className="mt-4 text-xs text-dark-text/60">Last updated {updated}</p>
      </header>
      <div className="divide-y divide-soft-border px-6 sm:px-10">
        {sections.map((section) => <section key={section.title} className="py-6 sm:py-8">
          <h2 className="font-display text-3xl font-semibold text-deep-berry">{section.title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-dark-text/80">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {section.bullets && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-dark-text/80">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
        </section>)}
      </div>
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-soft-border bg-brand-white px-6 py-5 text-sm sm:px-10">
        <Link href="/privacy" className="font-medium text-deep-berry underline decoration-brand-pink/50 underline-offset-4">Privacy</Link>
        <Link href="/terms" className="font-medium text-deep-berry underline decoration-brand-pink/50 underline-offset-4">Terms & booking</Link>
        <Link href="/cookies" className="font-medium text-deep-berry underline decoration-brand-pink/50 underline-offset-4">Cookies</Link>
        <a href="mailto:info@sboshsbeautystudio.co.za" className="font-medium text-deep-berry underline decoration-brand-pink/50 underline-offset-4">Contact the studio</a>
      </footer>
    </article>
  </main>;
}
