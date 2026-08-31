import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { BrandHeader } from "@/components/site/BrandHeader";
import { BrandServices } from "@/components/site/BrandServices";
import { BrandRepairs } from "@/components/site/BrandRepairs";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getServices } from "@/lib/catalogue";
import { brandsFor } from "@/lib/catalogue-shared";
import { getBrands } from "@/lib/brands";
import { DEFAULT_BRANDS } from "@/lib/brands-shared";

/**
 * One page per manufacturer — what people search for is "Samsung AC repair".
 *
 * Only the makes that ship with the build are prerendered; a company added in
 * the panel is not known at build time and renders on first request instead.
 */
export function generateStaticParams() {
  return DEFAULT_BRANDS.map((b) => ({ brand: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: id } = await params;
  const brand = (await getBrands()).find((b) => b.id === id);
  if (!brand) return { title: "Brand" };
  const title = `${brand.name} appliance repair`;
  const description = `Authorised ${brand.name} repair across Telangana — refrigerators, washing machines, microwaves and air conditioners. Genuine parts, 90-day warranty, technicians trained on ${brand.name} models.`;
  return {
    title,
    description,
    alternates: { canonical: `/brands/${brand.id}` },
    // Without these the card shared into a WhatsApp group inherits the
    // site-wide blurb, which names all four makes — the one thing this page
    // exists not to do.
    openGraph: {
      title: `${title} · 24X7 Services`,
      description,
      url: `/brands/${brand.id}`,
    },
    twitter: { title: `${title} · 24X7 Services`, description },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: id } = await params;
  const brand = (await getBrands()).find((b) => b.id === id);
  if (!brand) notFound();

  const services = (await getServices()).filter((s) => brandsFor(s).includes(brand.id));

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <BrandHeader brand={brand} services={services.length} />
        <BrandServices brand={brand} services={services} />
        <BrandRepairs brand={brand} services={services} />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
