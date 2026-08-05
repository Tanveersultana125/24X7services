import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BackLink } from "@/components/ui/BackLink";
import { WriteReview, type RateableJob } from "@/components/reviews/WriteReview";
import { getCustomerSession } from "@/lib/customer/auth";
import { listCustomerBookings } from "@/lib/bookings";
import { listCustomerReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Write a review",
  description: "Tell us how your 24X7 Services experience went — it takes a minute.",
};

export const dynamic = "force-dynamic";

/**
 * Open to everyone: a visitor can review the service, and a signed-in customer
 * can attach the review to one of their completed visits so it publishes as
 * verified. Signing in is offered, never required.
 */
export default async function WriteReviewPage() {
  const user = await getCustomerSession();

  let jobs: RateableJob[] = [];
  if (user) {
    const [bookings, reviews] = await Promise.all([
      listCustomerBookings(user.uid).catch(() => []),
      listCustomerReviews(user.uid).catch(() => []),
    ]);
    const reviewed = new Set(reviews.map((r) => r.bookingId));
    jobs = bookings
      .filter((b) => b.status === "completed" && !reviewed.has(b.id))
      .map((b) => ({
        bookingId: b.id,
        code: b.code,
        appliance: `${b.brand ? `${b.brand} ` : ""}${b.appliance}`,
        when: b.slot ? `${b.date} · ${b.slot}` : b.date,
      }));
  }

  return (
    <>
      <SiteNav />
      {/* pb clears the fixed chat button so it never covers the submit row */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-28 sm:pt-32">
        <BackLink />

        <div className="mb-8 mt-6 max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted">
            Your feedback
          </p>
          <h1 className="font-display mt-4 text-[2.2rem] leading-[1.1] tracking-[-0.03em] sm:text-5xl">
            Write a review
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted">
            {jobs.length > 0
              ? "Pick the visit you'd like to rate — it publishes with a verified mark — or leave general feedback about our service."
              : "Tell us how it went. Every review is read by our team and published after a quick check."}
            {!user && " You can sign in if you'd like your review tied to a booking."}
          </p>
        </div>

        <WriteReview jobs={jobs} signedInAs={user?.name} />
      </main>
      <SiteFooter />
    </>
  );
}
