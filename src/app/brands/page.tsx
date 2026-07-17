import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { BrandShowcase } from "@/components/site/BrandShowcase";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Authorised Brands",
  description:
    "Brand-certified technicians and genuine parts for Samsung, LG, IFB and Bosch appliances.",
};

export default function BrandsPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1 pt-16">
        <BrandShowcase />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
