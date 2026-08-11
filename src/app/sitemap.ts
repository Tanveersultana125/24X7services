import type { MetadataRoute } from "next";
import { BRANDS } from "@/lib/data";

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
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.8,
  }));
}
