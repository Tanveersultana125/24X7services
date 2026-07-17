import type { MetadataRoute } from "next";

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
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.8,
  }));
}
