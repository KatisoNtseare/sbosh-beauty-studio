"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#gallery", label: "Gallery" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5 md:px-16">
      <Link
        href="/"
        className="font-display text-[34px] font-semibold leading-none tracking-[0.14em] text-gold"
      >
        SBOSH
        <span className="block font-sans text-[10px] font-medium tracking-[0.34em]">
          BEAUTY STUDIO
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap items-center gap-7">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "border-b-2 border-transparent py-2 text-[13px] uppercase tracking-[0.14em] hover:text-gold",
              l.href === "/" && pathname === "/" && "border-gold text-gold"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/book"
        className={cn(
          buttonStyles(),
          pathname === "/book" && "pointer-events-none opacity-60"
        )}
      >
        Book now
      </Link>
    </header>
  );
}