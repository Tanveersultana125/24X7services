import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { BrandShowcase } from "@/components/site/BrandShowcase";
import { BrandsDetail } from "@/components/site/BrandsDetail";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Authorised Brands",
  description:
    "Brand-certified technicians and genuine parts for Samsung, LG, IFB and Bosch across Telangana — with model-specific training and warranty-safe service.",
};

export default function BrandsPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Brands"
          title="Authorised Brands"
          subtitle="We're certified for the brands you own — with model-specific training and genuine spare parts, so every repair keeps your warranty intact."
          stats={[
            { value: "4", label: "Authorised brands" },
            { value: "100%", label: "Genuine parts" },
            { value: "12k+", label: "Certified pros" },
          ]}
          logos
        />
        <BrandShowcase />
        <BrandsDetail />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
