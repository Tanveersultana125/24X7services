import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { ServicesIndex } from "@/components/site/ServicesIndex";
import { getServiceIndex, getServiceIndexCopy } from "@/lib/service-index";
import { ServicesDetail } from "@/components/site/ServicesDetail";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Premium Services",
  description:
    "Eight premium appliance services across Telangana — AC, refrigerator, washing machine and microwave & oven repair, plus installation, uninstallation, annual maintenance and 24×7 emergency repair. Transparent pricing and a 90-day warranty.",
};

export default async function ServicesPage() {
  const [services, copy] = await Promise.all([getServiceIndex(), getServiceIndexCopy()]);
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Services"
          title="Premium Services"
          subtitle="From a five-minute microwave fix to a full annual contract — eight services, every one held to the same obsessive standard."
          stats={[
            { value: "8", label: "Service types" },
            { value: "free", label: "Diagnosis" },
            { value: "90-day", label: "Warranty" },
          ]}
          bgImage="/work/fridge-hero-wide.webp"
          bgImageNarrow="/work/fridge-hero-scene.webp"
          /* The scene sits at the right of the plate and the navy field it
             was drawn with runs off to the left, so a narrow crop should eat
             into the field rather than into the technician. */
          bgPos="right center"
          bgDark
        />
        <ServicesIndex services={services} copy={copy} />
        <ServicesDetail />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
