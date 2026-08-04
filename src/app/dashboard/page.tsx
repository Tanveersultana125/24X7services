import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
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
  if (!user) redirect("/login");

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
      <main className="mx-auto max-w-6xl overflow-x-clip px-5 pt-28 pb-28 sm:pt-32 sm:pb-20">
        <Dashboard
          user={user}
          bookings={bookings}
          reviewedBookingIds={reviews.map((r) => r.bookingId)}
        />
      </main>
    </>
  );
}
