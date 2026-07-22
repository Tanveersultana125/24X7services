import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { Reviews } from "@/components/site/Reviews";
import { RatingBreakdown } from "@/components/site/RatingBreakdown";
import { Stats } from "@/components/site/Stats";
import { QuickEstimate } from "@/components/site/QuickEstimate";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Three million homes, one quiet standard. Read verified reviews, the rating breakdown, and the numbers behind 24X7 Services.",
};

export default function ReviewsPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Reviews"
          title="Customer Reviews"
          subtitle="Verified, unfiltered and earned one visit at a time — see exactly why three million homes rate us 4.9 out of 5."
          bgImage="/work/ac-outdoor-service.png"
          bgDark
          stats={[
            { value: "4.9", label: "Average rating" },
            { value: "128k", label: "Reviews" },
            { value: "92%", label: "Five-star" },
          ]}
        />
        <RatingBreakdown />
        <Reviews />
        <Stats />
        <QuickEstimate />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
