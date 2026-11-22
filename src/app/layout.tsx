import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { businessProfile } from "@/lib/brand";
import ToastViewport from "@/components/ToastViewport";
import WhatsAppFloatingButton from "@/components/site/WhatsAppFloatingButton";
import BusinessStructuredData from "@/components/site/BusinessStructuredData";
import { studioShareImage } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sboshsbeautystudio.co.za"),
  title: { default: businessProfile.name, template: `%s - ${businessProfile.name}` },
  description:
    `Manicures, gel nails, overlays, nail repair, and buff & shine at ${businessProfile.name} in Bram Fischerville, Roodepoort.`,
  applicationName: businessProfile.name,
  icons: {
    icon: [
      { url: "/favicon/studio-mark.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: businessProfile.name,
    title: businessProfile.name,
    description: `Manicure, gel nails, overlays, nail repair and buff & shine in Bram Fischerville, Roodepoort.`,
    images: [studioShareImage],
  },
  twitter: { card: "summary_large_image", title: businessProfile.name, description: `Nail care in Bram Fischerville, Roodepoort.`, images: [studioShareImage.url] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ToastViewport />
        <BusinessStructuredData />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
