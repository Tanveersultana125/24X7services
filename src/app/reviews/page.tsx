import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { Reviews } from "@/components/site/Reviews";
import { Stats } from "@/components/site/Stats";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Three million homes, one quiet standard. Read verified reviews and the numbers behind 24X7 Services.",
};

export default function ReviewsPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1 pt-16">
        <Reviews />
        <Stats />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
