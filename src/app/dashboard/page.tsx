import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { getCustomerSession } from "@/lib/customer/auth";
import { listCustomerBookings } from "@/lib/bookings";
import { listCustomerReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Manage bookings, invoices, warranties and AMC plans.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCustomerSession();
  // Name the destination: without it, signing in falls back to whatever that
  // login page was last asked for — a customer who came here to rate a service
  // could land on the booking form instead.
  if (!user) redirect("/login?next=%2Fdashboard");

  const [bookings, reviews] = await Promise.all([
    listCustomerBookings(user.uid).catch(() => []),
    listCustomerReviews(user.uid).catch(() => []),
  ]);

  return (
    <>
      <SiteNav />
      {/* overflow-x-clip: a single mis-sized child shouldn't let the whole
          dashboard scroll sideways on a phone */}
      {/* pb clears the fixed chat button (bottom-5 + size-14) so it never
          sits on top of the last card */}
      {/* flex-1 + footer, same as every other page: without them a short
          dashboard trails off into a screenful of empty background */}
      <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-5 pt-28 pb-16 sm:pt-32">
        <Dashboard
          user={user}
          bookings={bookings}
          reviewedBookingIds={reviews.map((r) => r.bookingId)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
