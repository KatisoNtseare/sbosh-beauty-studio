"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiGrid } from "react-icons/fi";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";
import { businessProfile } from "@/lib/brand";

const links = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Price list" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/session", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setIsAdmin(data.authenticated === true))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-soft-border/70 bg-brand-white/90 px-3 backdrop-blur-xl sm:px-5 md:px-16">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 md:min-h-[82px] md:gap-5">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          aria-label={`${businessProfile.name} home`}
          className="shrink-0"
        >
          <Image src="/images/sbosh-beauty-studio-logo.svg" alt={businessProfile.name} width={220} height={56} priority className="h-auto w-[138px] sm:w-[195px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-10 lg:flex">
          {links.map((link) => {
            const active = link.href === pathname;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-text/70 transition-colors hover:text-deep-berry",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-brand-pink after:transition-transform hover:after:scale-x-100",
                  active && "text-deep-berry after:scale-x-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAdmin && <Link href="/admin" aria-label="Open admin dashboard" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-brand-pink/35 bg-surface px-3 text-deep-berry transition-colors hover:bg-pale-blush sm:min-h-11 sm:px-4"><FiGrid aria-hidden="true" size={16}/><span className="hidden sm:inline text-[11px] font-semibold">Dashboard</span></Link>}
          <Link href="/services" className={cn(buttonStyles(), "min-h-10 px-3 text-[10px] sm:min-h-11 sm:px-5 sm:text-[11px]")}>
            <span className="sm:hidden">Book</span><span className="hidden sm:inline">Book appointment</span>
          </Link>
          <button
            type="button"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-soft-border text-deep-berry lg:hidden"
          >
            <span className={cn("h-px w-4 bg-current transition-transform", menuOpen && "translate-y-[3px] rotate-45")} />
            <span className={cn("h-px w-4 bg-current transition-transform", menuOpen && "-translate-y-[3px] -rotate-45")} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile" className="border-t border-soft-border py-2 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={link.href === pathname ? "page" : undefined}
              className={cn(
                "block min-h-12 border-b border-soft-border/70 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-dark-text/80 last:border-0",
                link.href === pathname && "border-l-2 border-l-brand-pink pl-3 text-deep-berry"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
