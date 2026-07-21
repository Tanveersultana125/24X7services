import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { MostBooked } from "@/components/site/MostBooked";
import { Spotlight } from "@/components/site/Spotlight";
import { Noteworthy } from "@/components/site/Noteworthy";
import { BrandShowcase } from "@/components/site/BrandShowcase";
import { Process } from "@/components/site/Process";
import { TrustBento } from "@/components/site/TrustBento";
import { Emergency } from "@/components/site/Emergency";
import { Plans } from "@/components/site/Plans";
import { Reviews } from "@/components/site/Reviews";
import { Stats } from "@/components/site/Stats";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
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
        <BrandShowcase />
        <Process />
        <TrustBento />
        <Emergency />
        <Plans />
        <Reviews />
        <Stats />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
