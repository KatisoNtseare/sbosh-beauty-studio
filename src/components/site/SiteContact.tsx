"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { businessProfile } from "@/lib/brand";
import { buttonStyles } from "@/lib/button";
import { cn } from "@/lib/utils";

type Contact = { phone: string; phoneHref: string; internationalPhone: string; whatsappNumber: string; whatsappHref: string; email: string; emailHref: string; address: string; mapHref: string };

export function useSiteContact(enabled = true) {
  const [contact, setContact] = useState<Contact>(businessProfile.contact);
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/site-settings").then((response) => response.json()).then((data) => {
      if (data.contact) setContact(data.contact);
    }).catch(() => undefined);
  }, [enabled]);
  return contact;
}

export function StudioDirectionsLink({ children, className }: { children: React.ReactNode; className: string }) {
  const contact = useSiteContact();
  return <Link href={contact.mapHref} target="_blank" rel="noreferrer" className={className}>{children}</Link>;
}

export function StudioContactActions({ dark = false, showCallButton = false, showDetails = true }: { dark?: boolean; showCallButton?: boolean; showDetails?: boolean }) {
  const contact = useSiteContact();
  const linkColor = dark ? "text-silver/85 hover:text-pale-blush" : "text-deep-berry hover:text-strong-pink";
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
    {showDetails && <>
      <a href={contact.phoneHref} className={`${linkColor} ${dark ? "underline decoration-soft-pink/60 underline-offset-4" : ""}`}>{contact.phone}</a>
      <a href={contact.whatsappHref} target="_blank" rel="noreferrer" className={`${linkColor} underline decoration-brand-pink/50 underline-offset-4`}>WhatsApp</a>
      <a href={contact.emailHref} className={`${linkColor} underline decoration-brand-pink/50 underline-offset-4`}>{contact.email}</a>
    </>}
    {showCallButton && <a href={contact.phoneHref} className={cn(buttonStyles({ variant: "outline" }), dark && "border-silver/70 text-silver hover:bg-surface/10")}>Call the studio</a>}
  </div>;
}
