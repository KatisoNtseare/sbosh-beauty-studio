import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Cookie and storage notice", description: `How ${businessProfile.name} uses browser storage and essential admin cookies.` };

const sections: LegalSection[] = [
  { title: "Browser storage for your booking cart", paragraphs: ["The website saves your selected services and package choices in local storage on your device so they remain in your cart as you browse. This storage is not used for advertising. You can clear it through your browser settings; doing so removes the saved cart."] },
  { title: "Admin session cookie", paragraphs: ["When an administrator signs in, the site uses a strictly necessary, HTTP-only session cookie to keep the admin area secure. It is marked secure in production, restricted to the same site, and expires after eight hours. Customers do not receive this admin cookie."] },
  { title: "Analytics and third-party links", paragraphs: ["The site does not currently use advertising or analytics cookies. If you follow a WhatsApp or map link, that third-party service may use its own technologies under its own policies."] },
  { title: "Contact", paragraphs: [`For questions about browser storage or this notice, contact ${businessProfile.contact.email}.`] },
];

export default function CookiesPage() { return <LegalPage title="Cookie & storage notice" intro="A simple explanation of the small amount of browser storage this booking site uses." sections={sections}/>; }
