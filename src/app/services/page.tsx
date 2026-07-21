import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { ServicesIndex } from "@/components/site/ServicesIndex";
import { ServicesDetail } from "@/components/site/ServicesDetail";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Premium Services",
  description:
    "Eight premium appliance services — refrigerator, washing machine, microwave & oven repair, plus installation, uninstallation, annual maintenance and 24×7 emergency repair. Transparent pricing and a 90-day warranty.",
};

export default function ServicesPage() {
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
          image="/work/ac-service.png"
        />
        <ServicesIndex />
        <ServicesDetail />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
