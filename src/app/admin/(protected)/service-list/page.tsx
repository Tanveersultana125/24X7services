import { ServiceIndexManager } from "@/components/admin/ServiceIndexManager";
import { StorageNotice } from "@/components/admin/StorageNotice";
import { getServiceIndexForAdmin } from "@/lib/service-index";
import { getServices } from "@/lib/catalogue";
import { describeStorage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function AdminServiceListPage() {
  const [index, catalogue, storage] = await Promise.all([
    getServiceIndexForAdmin(),
    // What a row on this page can book — the live catalogue, not a fixed list,
    // so a service added under Services & prices can be linked to straight away.
    getServices(),
    describeStorage(),
  ]);

  return (
    <>
      <StorageNotice status={storage} />
      <ServiceIndexManager
        initial={index.rows}
        copy={index.copy}
        appliances={catalogue.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
