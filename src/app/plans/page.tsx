import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { Plans } from "@/components/site/Plans";
import { PlansCompare } from "@/components/site/PlansCompare";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "AMC Plans",
  description:
    "Annual maintenance plans that pay for themselves — preventive visits, priority dispatch and genuine parts. Compare Essential, Premium and Business side by side.",
};

export default function PlansPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Plans"
          title="AMC Membership"
          subtitle="One annual plan keeps every appliance in your home running — preventive visits, priority dispatch and genuine parts, all in."
          stats={[
            { value: "3", label: "Plans" },
            { value: "₹1,499", label: "From / year" },
            { value: "4", label: "Visits included" },
          ]}
        />
        <Plans />
        <PlansCompare />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
