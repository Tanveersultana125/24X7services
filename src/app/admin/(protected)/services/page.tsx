import { ServicesManager } from "@/components/admin/ServicesManager";
import { getCatalogue } from "@/lib/catalogue";
import { getAllBrands } from "@/lib/brands";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  // Hidden services included — the panel is where you un-hide them. Hidden
  // makes too: a service can be priced for one before it goes back on the site.
  const [services, brands] = await Promise.all([getCatalogue(), getAllBrands()]);
  return <ServicesManager initial={services} brands={brands} />;
}
