import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { Plans } from "@/components/site/Plans";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "AMC Plans",
  description:
    "Annual maintenance plans that pay for themselves — preventive visits, priority dispatch and genuine parts for every appliance in your home.",
};

export default function PlansPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1 pt-16">
        <Plans />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
