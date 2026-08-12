import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_GALLERY, type GalleryPhoto } from "@/lib/gallery-shared";

export type { GalleryPhoto };

const GALLERY = "gallery";
/** Records that the shipped photos were planted, so emptying the gallery sticks. */
const SEED_MARKER = "meta/gallerySeeded";

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

/**
 * Plant the shipped photographs the first time this runs, and only ever once.
 *
 * The Process page fell back to them whenever the collection was empty, so the
 * site showed nine photos the panel couldn't see, and deleting them all put
 * them straight back. Once they are rows like any other, the panel lists what
 * the page shows and a deletion means what it says. The marker is what keeps
 * "I deleted them all" from reading as "first run".
 */
async function seedOnce(): Promise<void> {
  const db = getAdminDb();

  // Claimed with create(), not checked with get(): two requests rendering at
  // once both pass a read-then-write check and seed the gallery twice. create()
  // fails on the second, so exactly one caller ever plants them.
  try {
    await db.doc(SEED_MARKER).create({ at: FieldValue.serverTimestamp() });
  } catch {
    return;
  }

  const batch = db.batch();
  // Oldest first, so the newest-first list ends up in the shipped order.
  DEFAULT_GALLERY.forEach((photo, i) => {
    batch.set(db.collection(GALLERY).doc(), {
      ...photo,
      createdAt: new Date(Date.now() - (DEFAULT_GALLERY.length - i) * 1000),
    });
  });
  await batch.commit();
}

/** Newest first. Sorted in memory so no composite index is needed. */
export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  const db = getAdminDb();
  await seedOnce();
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
