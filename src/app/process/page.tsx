import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { Process } from "@/components/site/Process";
import { WorkGallery } from "@/components/site/WorkGallery";
import { Guarantees } from "@/components/site/Guarantees";
import { TrustBento } from "@/components/site/TrustBento";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From broken to brilliant in four moves — AI diagnosis, same-day booking, live technician tracking, and four guarantees in writing.",
};

export default function ProcessPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Process"
          title="How It Works"
          subtitle="A booking experience engineered to feel as premium as the repair — no call centres, no haggling, no waiting around."
          stats={[
            { value: "4", label: "Simple steps" },
            { value: "< 90m", label: "Avg. arrival" },
            { value: "24×7", label: "Availability" },
          ]}
        />
        <Process />
        <WorkGallery />
        <Guarantees />
        <TrustBento />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
