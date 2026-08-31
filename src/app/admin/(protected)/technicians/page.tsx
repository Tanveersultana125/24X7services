import { TechniciansManager } from "@/components/admin/TechniciansManager";
import { listTechnicians } from "@/lib/technicians";
import { getServices } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function AdminTechniciansPage() {
  // What they can be trained on is the live catalogue, not a fixed list — a
  // service added under Services & prices is one somebody has to be able to do.
  const [technicians, services] = await Promise.all([listTechnicians(), getServices()]);
  return (
    <TechniciansManager initial={technicians} appliances={services.map((s) => s.name)} />
  );
}
