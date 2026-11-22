import { businessProfile } from "@/lib/brand";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sboshsbeautystudio.co.za";

const business = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "@id": `${siteUrl}/#business`,
  name: businessProfile.name,
  url: siteUrl,
  image: `${siteUrl}/images/hero_image.jpg`,
  telephone: businessProfile.contact.phone,
  email: businessProfile.contact.email,
  description: "Nail and lash appointments in Bram Fischerville, Roodepoort, including manicures, gel nails, overlays, nail repair, and buff & shine.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "12252 Snakeclose Street",
    addressLocality: "Bram Fischerville",
    addressRegion: "Gauteng",
    postalCode: "1725",
    addressCountry: "ZA",
  },
  areaServed: ["Bram Fischerville", "Roodepoort"],
};

export default function BusinessStructuredData() {
  const json = JSON.stringify(business).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
