"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";
import { businessProfile } from "@/lib/brand";

const links = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Our studio" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-soft-border bg-brand-white/95 px-5 backdrop-blur-md md:px-16">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          aria-label={`${businessProfile.name} home`}
          className="shrink-0 font-display text-[30px] font-semibold leading-[0.82] tracking-[0.12em] text-deep-berry"
        >
          {businessProfile.logo}
          <span className="mt-2 block font-sans text-[8px] font-medium tracking-[0.34em] text-deep-berry">
            BEAUTY STUDIO
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((link) => {
            const active = link.href === pathname;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b border-transparent py-2 text-xs font-medium text-dark-text/75 transition-colors hover:border-brand-pink hover:text-deep-berry",
                  active && "border-brand-pink text-deep-berry"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link href="/services" className={cn(buttonStyles(), "min-h-11 px-5 text-[11px] sm:text-xs")}>
            Book appointment
          </Link>
          <button
            type="button"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-10 flex-col items-center justify-center gap-[5px] rounded-full border border-soft-border text-dark-text lg:hidden"
          >
            <span className={cn("h-px w-4 bg-current transition-transform", menuOpen && "translate-y-[3px] rotate-45")} />
            <span className={cn("h-px w-4 bg-current transition-transform", menuOpen && "-translate-y-[3px] -rotate-45")} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile" className="border-t border-soft-border py-3 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={link.href === pathname ? "page" : undefined}
              className={cn("block border-b border-soft-border/70 py-3 text-sm text-dark-text/80 last:border-0", link.href === pathname && "border-l-2 border-l-brand-pink pl-3 font-semibold text-deep-berry")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
