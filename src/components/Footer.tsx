"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { businessProfile } from "@/lib/brand";
import { useSiteContact } from "@/components/site/SiteContact";

const footerLinks = [
  { label: "Services", href: "/services" },
  { label: "Packages", href: "/services#combination-packages" },
  { label: "About", href: "/about" },
  { label: "Studio", href: "/gallery" },
];

const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms & booking", href: "/terms" },
  { label: "Cookie notice", href: "/cookies" },
];

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const studioContact = useSiteContact(!isAdmin);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <footer className="bg-deep-berry px-4 pb-7 pt-12 text-charcoal sm:px-6 sm:pt-16 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 sm:gap-12 md:grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr]">
          <div>
            <Link href="/" aria-label={`${businessProfile.name} home`} className="inline-block rounded-xl bg-brand-white p-2.5">
                <Image src="/images/sbosh-beauty-studio-logo.svg" alt={businessProfile.name} width={260} height={65} className="h-auto w-[205px] sm:w-[230px]" />
            </Link>
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

          <nav aria-label="Legal" className="grid content-start gap-3 text-sm">
            <span className="eyebrow mb-2 text-rose-gold">Information</span>
            {legalLinks.map((link) => <Link key={link.href} href={link.href} className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">{link.label}</Link>)}
          </nav>

          <div className="grid content-start gap-3 text-sm">
            <span className="eyebrow mb-2 text-rose-gold">Visit or contact us</span>
            <a href={studioContact.phoneHref} className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">
              {studioContact.phone}
            </a>
            <a href={studioContact.whatsappHref} target="_blank" rel="noreferrer" className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">WhatsApp</a>
            <a href={studioContact.emailHref} className="w-fit text-charcoal/80 transition-colors hover:text-rose-gold">{studioContact.email}</a>
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal/70"><p>© {businessProfile.name}</p><p>Website by <span className="font-semibold text-charcoal/90">ProIT Solutions</span></p></div>
      </div>
    </footer>
  );
}
