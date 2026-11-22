"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { useSiteContact } from "@/components/site/SiteContact";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const contact = useSiteContact(!pathname.startsWith("/admin"));

  if (pathname.startsWith("/admin")) return null;

  return <a
    href={contact.whatsappHref}
    target="_blank"
    rel="noreferrer"
    aria-label="Chat with Sbosh’s Beauty Studio on WhatsApp"
    className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgb(37_211_102/0.35)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-berry sm:right-6"
  >
    <FaWhatsapp aria-hidden="true" className="size-7" />
  </a>;
}
