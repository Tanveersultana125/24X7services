import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BackLink } from "@/components/ui/BackLink";
import { WriteReview, type RateableJob } from "@/components/reviews/WriteReview";
import { getCustomerSession } from "@/lib/customer/auth";
import { listCustomerBookings } from "@/lib/bookings";
import { listCustomerReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Rate your service",
  description: "Rate a completed 24X7 Services visit and tell us how it went.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WriteReviewPage() {
  const user = await getCustomerSession();
  if (!user) redirect(`/login?next=${encodeURIComponent("/reviews/new")}`);

  const [bookings, reviews] = await Promise.all([
    listCustomerBookings(user.uid).catch(() => []),
    listCustomerReviews(user.uid).catch(() => []),
  ]);

  const reviewed = new Set(reviews.map((r) => r.bookingId));
  const toJob = (b: (typeof bookings)[number]): RateableJob => ({
    bookingId: b.id,
    code: b.code,
    appliance: `${b.brand ? `${b.brand} ` : ""}${b.appliance}`,
    when: b.slot ? `${b.date} · ${b.slot}` : b.date,
  });

  const completed = bookings.filter((b) => b.status === "completed");

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
            Rate your service
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted">
            Signed in as {user.email}. Every review here is tied to a visit we actually made — pick
            the job and tell us how it went. Our team publishes it after a quick check.
          </p>
        </div>

        <WriteReview
          jobs={completed.filter((b) => !reviewed.has(b.id)).map(toJob)}
          ratedJobs={completed.filter((b) => reviewed.has(b.id)).map(toJob)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
