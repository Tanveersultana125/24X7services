import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { getCustomerSession } from "@/lib/customer/auth";

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Manage bookings, invoices, warranties and AMC plans.",
};

export default async function DashboardPage() {
  const user = await getCustomerSession();
  if (!user) redirect("/login");

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:pt-32">
        <Dashboard user={user} />
      </main>
    </>
  );
}
