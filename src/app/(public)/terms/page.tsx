import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { businessProfile } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms and booking policy", description: `Booking and website terms for ${businessProfile.name} in Roodepoort.` };

const sections: LegalSection[] = [
  { title: "Appointment requests", paragraphs: ["Submitting a request tells the studio your preferred services, date, and time. It is not a confirmed appointment. The studio will review availability and contact you by email with the outcome. Your appointment is confirmed only when you receive approval from the studio.", "Requested times remain subject to availability until approved. If the requested time is no longer available, the studio may contact you to arrange another time."] },
  { title: "Prices and services", paragraphs: ["The website shows the studio’s current service and package catalogue. Optional extras may have separate charges. The studio will clarify any price that needs confirmation before approving the appointment. No online payment is collected through this booking form.", "Service descriptions and photographs are provided to help you choose. Results, colour, and appearance can vary with individual nails, products, and lighting."] },
  { title: "Changes and cancellations", paragraphs: [`To change or cancel a request or approved appointment, contact the studio as soon as possible at ${businessProfile.contact.phone} or ${businessProfile.contact.email}. Any specific cancellation or late-arrival arrangement will be communicated by the studio when confirming your appointment.`] },
  { title: "Your information", paragraphs: ["Please provide accurate contact details and tell the studio promptly if they change. Use the optional notes only for information relevant to your appointment. Personal information is handled as described in our ", "Privacy Policy."] },
  { title: "Website use", paragraphs: ["Please use the booking service lawfully and do not interfere with its operation or attempt to access the admin area without permission. Catalogue details, availability, and website content may be updated as the studio’s offering changes."] },
  { title: "Contact", paragraphs: [`Questions about these terms or a booking can be sent to ${businessProfile.contact.email} or by phone at ${businessProfile.contact.phone}. The studio is located at ${businessProfile.contact.address}.`] },
];

export default function TermsPage() { return <LegalPage title="Terms & booking" intro="A few clear details about requesting an appointment, prices, and using the Sbosh’s Beauty Studio website." sections={sections}/>; }
