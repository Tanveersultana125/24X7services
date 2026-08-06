import { GalleryManager } from "@/components/admin/GalleryManager";
import { listGalleryPhotos } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const photos = await listGalleryPhotos().catch(() => []);
  return <GalleryManager initial={photos} />;
}
