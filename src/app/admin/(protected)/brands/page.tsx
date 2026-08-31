import { BrandsManager } from "@/components/admin/BrandsManager";
import { getAllBrands } from "@/lib/brands";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  // Hidden makes included — the panel is where you un-hide them.
  const brands = await getAllBrands();
  return <BrandsManager initial={brands} />;
}
