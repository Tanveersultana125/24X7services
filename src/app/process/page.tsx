import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { Process } from "@/components/site/Process";
import { TrustBento } from "@/components/site/TrustBento";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From broken to brilliant in four moves — AI diagnosis, same-day booking, live technician tracking, and a 90-day warranty.",
};

export default function ProcessPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1 pt-16">
        <Process />
        <TrustBento />
      </main>
      <SiteFooter />
    </>
  );
}
