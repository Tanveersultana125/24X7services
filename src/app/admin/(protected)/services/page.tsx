import { ServicesManager } from "@/components/admin/ServicesManager";
import { getCatalogue } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  // Hidden services included — the panel is where you un-hide them.
  const services = await getCatalogue();
  return <ServicesManager initial={services} />;
}
