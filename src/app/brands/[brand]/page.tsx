import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { PageHeader } from "@/components/site/PageHeader";
import { BrandServices } from "@/components/site/BrandServices";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getServices } from "@/lib/catalogue";
import { brandsFor } from "@/lib/catalogue-shared";
import { BRANDS } from "@/lib/data";

/** One page per manufacturer — what people search for is "Samsung AC repair". */
export function generateStaticParams() {
  return BRANDS.map((b) => ({ brand: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: id } = await params;
  const brand = BRANDS.find((b) => b.id === id);
  if (!brand) return { title: "Brand" };
  return {
    title: `${brand.name} appliance repair`,
    description: `Authorised ${brand.name} repair across Telangana — refrigerators, washing machines, microwaves and air conditioners. Genuine parts, 90-day warranty, technicians trained on ${brand.name} models.`,
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: id } = await params;
  const brand = BRANDS.find((b) => b.id === id);
  if (!brand) notFound();

  const services = (await getServices()).filter((s) => brandsFor(s).includes(brand.id));

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <PageHeader
          crumb={brand.name}
          title={`${brand.name} repair`}
          subtitle={`Authorised ${brand.name} service across Telangana — genuine parts, technicians trained on ${brand.name} models, and a 90-day written warranty on every repair.`}
          stats={[
            { value: String(services.length), label: "Appliances covered" },
            { value: "90 days", label: "Repair warranty" },
            { value: "< 90 min", label: "Avg. arrival" },
          ]}
        />
        <BrandServices brand={brand} services={services} />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
