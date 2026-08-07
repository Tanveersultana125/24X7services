import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { MostBooked } from "@/components/site/MostBooked";
import { Spotlight } from "@/components/site/Spotlight";
import { Noteworthy } from "@/components/site/Noteworthy";
import { CoolingSolutions } from "@/components/site/CoolingSolutions";
import { ClimateExpertise } from "@/components/site/ClimateExpertise";
import { BrandShowcase } from "@/components/site/BrandShowcase";
import { TrustBento } from "@/components/site/TrustBento";
import { Emergency } from "@/components/site/Emergency";
import { Testimonials } from "@/components/site/Testimonials";
import { Stats } from "@/components/site/Stats";
import { Faq } from "@/components/site/Faq";
import { SiteFooter } from "@/components/site/SiteFooter";
import { listPublishedReviews, toTestimonial } from "@/lib/reviews";
import { listSectionItems } from "@/lib/section-items";
import { getSectionOverrides } from "@/lib/section-overrides";

// Prerendered and refreshed every 5 minutes; admin approvals revalidate it
// immediately via revalidatePath in /api/admin/reviews.
export const revalidate = 300;

export default async function Home() {
  const reviews = await listPublishedReviews(12).catch(() => []);
  const cards = reviews.map(toTestimonial);
  // cards an admin added to the strips, on top of the built-in ones
  const added = await listSectionItems();
  const inSection = (id: string) => added.filter((i) => i.section === id);
  // rewrites and hidings applied to the cards that ship with each strip
  const overrides = await getSectionOverrides();

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <MostBooked added={inSection("most-booked")} overrides={overrides} />
        <Spotlight added={inSection("spotlight")} overrides={overrides} />
        <Noteworthy added={inSection("noteworthy")} overrides={overrides} />
        <CoolingSolutions />
        <ClimateExpertise />
        <BrandShowcase />
        <TrustBento />
        <Emergency />
        <Testimonials reviews={cards} />
        <Stats />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
