import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "24X7 Services — Home Appliance Repair",
    short_name: "24X7 Services",
    description:
      "Book certified doorstep repair, installation & AMC for Samsung, LG, IFB & Bosch appliances across Telangana. 24×7.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#1e88e5",
    categories: ["utilities", "productivity", "business"],
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a Service", url: "/book" },
      { name: "Track Technician", url: "/track" },
      { name: "My Dashboard", url: "/dashboard" },
    ],
  };
}
