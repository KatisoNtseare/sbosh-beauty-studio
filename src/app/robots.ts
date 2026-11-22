import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://sboshsbeautystudio.co.za";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/book", "/unauthorized"] }, sitemap: new URL("/sitemap.xml", base).toString() };
}
