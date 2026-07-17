import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { ServicesIndex } from "@/components/site/ServicesIndex";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Premium Services",
  description:
    "Eight premium appliance services — refrigerator, washing machine, microwave & oven repair, plus installation, uninstallation, annual maintenance and 24×7 emergency repair.",
};

export default function ServicesPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1 pt-16">
        <ServicesIndex />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
