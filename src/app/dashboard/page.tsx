import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Manage bookings, invoices, warranties and AMC plans.",
};

export default function DashboardPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:pt-32">
        <Dashboard />
      </main>
    </>
  );
}
