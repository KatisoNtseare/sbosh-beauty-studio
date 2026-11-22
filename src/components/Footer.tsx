import Link from "next/link";
import { studioContact } from "@/lib/data";
import { businessProfile } from "@/lib/brand";

const footerLinks = [
  { label: "Services", href: "/services" },
  { label: "Packages", href: "/services#combination-packages" },
  { label: "About", href: "/about" },
  { label: "Studio", href: "/gallery" },
];

export default function Footer() {
  return (
    <footer className="bg-deep-berry px-6 pb-8 pt-16 text-charcoal md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="font-display text-4xl font-semibold tracking-[0.14em]">
              {businessProfile.logo}
            </Link>
            <p className="mt-1 text-[9px] font-medium tracking-[0.4em] text-rose-gold">BEAUTY STUDIO</p>
            <p className="mt-5 max-w-xs text-sm leading-7 text-charcoal/75">
              A little colour, a little care, and a moment that is yours.
            </p>
          </div>

          <nav aria-label="Footer" className="grid content-start gap-3 text-sm">
            <span className="eyebrow mb-2 text-rose-gold">Explore</span>
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="grid content-start gap-3 text-sm">
            <span className="eyebrow mb-2 text-rose-gold">Visit or contact us</span>
            <a href={studioContact.phoneHref} className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">
              {studioContact.phone}
            </a>
            <a
              href={studioContact.mapHref}
              target="_blank"
              rel="noreferrer"
              className="max-w-xs leading-6 text-charcoal/80 transition-colors hover:text-rose-gold"
            >
              {studioContact.address}
            </a>
          </div>
        </div>

        <div aria-hidden="true" className="gold-rule mt-14" />
        <p className="mt-6 text-xs text-charcoal/70">© 2026 {businessProfile.name}</p>
      </div>
    </footer>
  );
}