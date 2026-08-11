import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { Process } from "@/components/site/Process";
import { WorkGallery } from "@/components/site/WorkGallery";
import { Guarantees } from "@/components/site/Guarantees";
import { TrustBento } from "@/components/site/TrustBento";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { listGalleryPhotos } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From broken to brilliant in four moves — AI diagnosis, same-day booking, live technician tracking, and four guarantees in writing.",
};

// Refreshed on demand: adding or removing a photo in the admin panel
// revalidates this page.
export const revalidate = 600;

export default async function ProcessPage() {
  const photos = await listGalleryPhotos().catch(() => []);

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb="Process"
          title="How It Works"
          subtitle="A booking experience engineered to feel as premium as the repair — no call centres, no haggling, no waiting around."
          stats={[
            { value: "4", label: "Simple steps" },
            { value: "< 90m", label: "Avg. arrival" },
            { value: "24×7", label: "Availability" },
          ]}
          collage={[
            "/work/gallery/ac-1.png",
            "/work/gallery/washing-3.webp",
            "/work/gallery/fridge-1.png",
            "/work/gallery/microwave-1.png",
          ]}
        />
        <Process />
        <WorkGallery photos={photos.map((p) => ({ src: p.src, label: p.label }))} />
        <Guarantees />
        <TrustBento />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
