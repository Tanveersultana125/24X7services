import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard"] },
    sitemap: "https://24x7services.example.com/sitemap.xml",
  };
}
