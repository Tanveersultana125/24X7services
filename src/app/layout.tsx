import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { ChatAssistant } from "@/components/site/ChatAssistant";
import { CartSync } from "@/components/site/CartSync";
import { ActivityTracker } from "@/components/site/ActivityTracker";
import { SiteImagesProvider } from "@/components/providers/SiteImagesProvider";
import { getSiteImages } from "@/lib/site-images";
import { ServicesProvider } from "@/components/providers/ServicesProvider";
import { getServices } from "@/lib/catalogue";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const SITE = {
  name: "24X7 Services",
  title: "24X7 Services — Home Appliance Repair Across Telangana, Same Day",
  description:
    "Book certified doorstep repair, installation, maintenance & AMC for Samsung, LG, IFB & Bosch air conditioners, refrigerators, washing machines, microwaves and ovens — across Hyderabad, Secunderabad and all 33 Telangana districts. Genuine parts, 90-day warranty, live tracking, 24×7.",
  url: "https://24x7services.example.com",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s · 24X7 Services",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "AC repair Hyderabad",
    "AC service Telangana",
    "appliance repair Hyderabad",
    "appliance repair Telangana",
    "washing machine repair Secunderabad",
    "appliance repair",
    "air conditioner repair",
    "refrigerator repair",
    "washing machine service",
    "microwave repair",
    "oven service",
    "Samsung service",
    "LG repair",
    "IFB service",
    "Bosch repair",
    "AMC plan",
    "doorstep technician",
  ],
  authors: [{ name: "24X7 Services" }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    title: SITE.title,
    description: SITE.description,
    siteName: SITE.name,
    url: SITE.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE.name },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: "+91-1800-200-247",
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  areaServed: { "@type": "State", name: "Telangana", containedInPlace: { "@type": "Country", name: "India" } },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "128400" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Resolved once per request (cached for a minute) so every section renders
  // the photo the admin panel currently has assigned.
  const [siteImages, services] = await Promise.all([getSiteImages(), getServices()]);

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider>
          <SiteImagesProvider images={siteImages}>
            <ServicesProvider services={services}>
              <SmoothScroll>{children}</SmoothScroll>
              <ChatAssistant />
              {/* Copy the basket, and the trail that led to it, to the panel.
                  Both render nothing. */}
              <CartSync />
              <ActivityTracker />
            </ServicesProvider>
          </SiteImagesProvider>
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
