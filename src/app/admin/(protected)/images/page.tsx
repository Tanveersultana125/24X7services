import { SiteImagesManager } from "@/components/admin/SiteImagesManager";
import { getSiteImages } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export default async function AdminSiteImagesPage() {
  const current = await getSiteImages();
  return <SiteImagesManager current={current} />;
}
