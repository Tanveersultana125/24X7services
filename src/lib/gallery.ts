import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { GalleryPhoto } from "@/lib/gallery-shared";

export type { GalleryPhoto };

const GALLERY = "gallery";

/**
 * Firestore data layer for the work gallery — the photos of real repairs shown
 * on the site.
 *
 * Photos are uploaded to Cloudinary from the admin panel; only the resulting
 * URL and its label live here.
 */


function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Newest first. Sorted in memory so no composite index is needed. */
export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  const db = getAdminDb();
  const snap = await db.collection(GALLERY).get();
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        src: data.src ?? "",
        label: data.label ?? "Untitled",
        category: data.category ?? "AC",
        createdAt: toMillis(data.createdAt),
      };
    })
    .filter((p) => p.src)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addGalleryPhoto(input: {
  src: string;
  label: string;
  category: string;
}): Promise<{ id: string }> {
  const db = getAdminDb();
  const ref = await db.collection(GALLERY).add({
    src: input.src,
    label: input.label,
    category: input.category,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(GALLERY).doc(id).delete();
}
