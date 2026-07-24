import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { getCustomerSession } from "@/lib/customer/auth";
import { listCustomerBookings } from "@/lib/bookings";

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Manage bookings, invoices, warranties and AMC plans.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCustomerSession();
  if (!user) redirect("/login");

  const bookings = await listCustomerBookings(user.uid).catch(() => []);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:pt-32">
        <Dashboard user={user} bookings={bookings} />
      </main>
    </>
  );
}
