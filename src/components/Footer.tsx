import Link from "next/link";

const footerLinks = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Studio moodboard", href: "/gallery" },
  { label: "Our approach", href: "/about" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-gold-dark px-6 py-10 text-cream md:px-16">
      <div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end">
        <div>
          <Link href="/" className="font-display text-3xl font-semibold tracking-[0.12em]">
            SBOSH
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream/75">
            A little room to pause, reset and feel like yourself.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-cream/85">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sm:text-right">
          <Link href="/book" className="inline-flex items-center gap-2 text-sm font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
            Plan your visit <span aria-hidden="true">↗</span>
          </Link>
          <p className="mt-3 text-[11px] text-cream/60">© {new Date().getFullYear()} SBOSH Beauty Studio</p>
        </div>
      </div>
    </footer>
  );
}
