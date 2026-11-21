import Link from "next/link";
import { studioContact } from "@/lib/data";

const footerLinks = [
  { label: "Services", href: "/services" },
  { label: "Nail menu", href: "/pricing" },
  { label: "Studio moodboard", href: "/gallery" },
  { label: "Our approach", href: "/about" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-gold-dark px-6 py-10 text-cream md:px-16">
      <div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-[1fr_1fr_1.1fr] sm:items-start">
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

        <div className="grid gap-2 text-xs text-cream/80">
          <span className="mb-1 font-semibold text-cream">Visit or contact us</span>
          <a href={studioContact.phoneHref} className="w-fit hover:text-white">{studioContact.phone}</a>
          <a href={studioContact.mapHref} target="_blank" rel="noreferrer" className="max-w-xs leading-5 hover:text-white">{studioContact.address}</a>
          <a href={studioContact.whatsappHref} target="_blank" rel="noreferrer" className="mt-1 w-fit font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">WhatsApp the studio ↗</a>
          <p className="mt-3 text-[11px] text-cream/60">© 2026 SBOSH Beauty Studio</p>
        </div>
      </div>
    </footer>
  );
}
