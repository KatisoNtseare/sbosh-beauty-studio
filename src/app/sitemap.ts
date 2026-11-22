import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://sboshsbeautystudio.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/pricing", "/about", "/gallery", "/privacy", "/terms", "/cookies"];
  return pages.map((page) => ({ url: new URL(page, base).toString(), changeFrequency: "weekly", priority: page ? 0.7 : 1 }));
}
