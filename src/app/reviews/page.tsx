import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { Reviews } from "@/components/site/Reviews";
import { RatingBreakdown } from "@/components/site/RatingBreakdown";
import { LeaveReviewCta } from "@/components/site/LeaveReviewCta";
import { Stats } from "@/components/site/Stats";
import { QuickEstimate } from "@/components/site/QuickEstimate";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { listPublishedReviews, summarise, toTestimonial } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Three million homes, one quiet standard. Read verified reviews, the rating breakdown, and the numbers behind 24X7 Services.",
};

// Prerendered and refreshed every 5 minutes; admin approvals revalidate it
// immediately via revalidatePath in /api/admin/reviews.
export const revalidate = 300;

export default async function ReviewsPage() {
  const reviews = await listPublishedReviews(48).catch(() => []);
  const summary = summarise(reviews);
  const cards = reviews.map(toTestimonial);

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
        <RatingBreakdown summary={summary} />
        <Reviews reviews={cards} count={summary.count} average={summary.average} />
        <LeaveReviewCta />
        <Stats />
        <QuickEstimate />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
