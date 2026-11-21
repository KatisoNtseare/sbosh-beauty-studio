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
    <footer className="border-t border-white/15 bg-deep-berry px-6 py-12 text-white md:px-16">
      <div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-[1fr_1fr_1.1fr] sm:items-start">
        <div>
          <Link href="/" className="font-display text-3xl font-semibold tracking-[0.12em]">
            {businessProfile.logo}
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/75">
            A little colour, a little care, and a moment that is yours.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/85">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-2 text-sm text-white/80">
          <span className="mb-1 font-semibold text-white">Visit or contact us</span>
          <a href={studioContact.phoneHref} className="w-fit hover:text-white">{studioContact.phone}</a>
          <a href={studioContact.mapHref} target="_blank" rel="noreferrer" className="max-w-xs leading-5 hover:text-white">{studioContact.address}</a>
          <p className="mt-3 text-xs text-white/80">© 2026 {businessProfile.name}</p>
        </div>
      </div>
    </footer>
  );
}
