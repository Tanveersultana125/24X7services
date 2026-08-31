import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Staff tools and the customer's own account pages are nobody's search
    // result. /admin already carries noindex on the page itself; this keeps
    // crawlers from asking for either in the first place.
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/tech"] },
    sitemap: "https://24x7services.example.com/sitemap.xml",
  };
}
