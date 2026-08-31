import { notFound } from "next/navigation";
import { BrandPricing } from "@/components/admin/BrandPricing";
import { getCatalogue } from "@/lib/catalogue";
import { getAllBrands } from "@/lib/brands";
import { DEFAULT_BRANDS } from "@/lib/brands-shared";

export const dynamic = "force-dynamic";

/** One page per manufacturer, matching the sidebar. */
export function generateStaticParams() {
  return DEFAULT_BRANDS.map((b) => ({ brand: b.id }));
}

export default async function AdminBrandPricingPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: id } = await params;
  const brand = (await getAllBrands()).find((b) => b.id === id);
  if (!brand) notFound();

  // Hidden services included: a price can be set before a service goes live.
  const services = await getCatalogue();
  return <BrandPricing brand={brand} services={services} />;
}
