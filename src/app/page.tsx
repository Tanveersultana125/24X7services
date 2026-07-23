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

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <MostBooked />
        <Spotlight />
        <Noteworthy />
        <CoolingSolutions />
        <ClimateExpertise />
        <BrandShowcase />
        <TrustBento />
        <Emergency />
        <Testimonials />
        <Stats />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
