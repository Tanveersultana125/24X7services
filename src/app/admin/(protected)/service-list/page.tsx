import { ServiceIndexManager } from "@/components/admin/ServiceIndexManager";
import { StorageNotice } from "@/components/admin/StorageNotice";
import { getServiceIndexForAdmin } from "@/lib/service-index";
import { describeStorage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function AdminServiceListPage() {
  const [rows, storage] = await Promise.all([getServiceIndexForAdmin(), describeStorage()]);
  return (
    <>
      <StorageNotice status={storage} />
      <ServiceIndexManager initial={rows} />
    </>
  );
}
