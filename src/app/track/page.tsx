import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { LiveTracking } from "@/components/tracking/LiveTracking";

export const metadata: Metadata = {
  title: "Live Tracking",
  description: "Track your technician in real time with live ETA and updates.",
};

export default function TrackPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 pt-28 pb-16 sm:pt-32">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Live Tracking</h1>
          <p className="mt-2 text-muted">Booking #24X7-482910 · Samsung Refrigerator · Not Cooling</p>
        </div>
        <LiveTracking />
      </main>
    </>
  );
}
