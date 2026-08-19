import type { MetadataRoute } from "next";
import { BRANDS } from "@/lib/data";
import { LEGAL_DOCS, REVIEW_PENDING } from "@/lib/legal";

const BASE = "https://24x7services.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/services",
    "/brands",
    "/process",
    "/plans",
    "/reviews",
    "/book",
    "/track",
    "/dashboard",
    // A page per manufacturer — "Samsung AC repair" is what gets searched for.
    ...BRANDS.map((b) => `/brands/${b.id}`),
    // The policies carry noindex until they have been reviewed, and asking a
    // crawler to fetch a page we have told it not to index is just noise.
    ...(REVIEW_PENDING ? [] : LEGAL_DOCS.map((d) => `/legal/${d.slug}`)),
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.8,
  }));
}
