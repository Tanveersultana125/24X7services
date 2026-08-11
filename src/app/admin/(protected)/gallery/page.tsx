import { GalleryManager } from "@/components/admin/GalleryManager";
import { StorageNotice } from "@/components/admin/StorageNotice";
import { listGalleryPhotos } from "@/lib/gallery";
import { describeStorage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const [photos, storage] = await Promise.all([
    listGalleryPhotos().catch(() => []),
    describeStorage(),
  ]);

  return (
    <>
      <StorageNotice status={storage} />
      <GalleryManager initial={photos} />
    </>
  );
}
