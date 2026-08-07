import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SectionId, SectionItem } from "@/lib/section-items-shared";

/**
 * Cards added from the admin panel, stored alongside the ones in the code.
 *
 * The built-in cards stay in the components: they are the shape of the design.
 * These are additions, appended after them, and can be removed again — which
 * is why they live in a collection rather than being edits to the code.
 */

const ITEMS = "sectionItems";

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function map(id: string, d: FirebaseFirestore.DocumentData): SectionItem {
  return {
    id,
    section: (d.section ?? "spotlight") as SectionId,
    src: d.src ?? "",
    title: d.title ?? "",
    sub: d.sub ?? "",
    cta: d.cta ?? "",
    price: typeof d.price === "number" ? d.price : 0,
    rating: typeof d.rating === "number" ? d.rating : 0,
    meta: d.meta ?? "",
    badge: d.badge ?? "",
    href: d.href ?? "/book",
    tint: d.tint ?? "#16306e",
    createdAt: toMillis(d.createdAt),
  };
}

/** Oldest first, so a new card lands at the end of its strip. */
export async function listSectionItems(): Promise<SectionItem[]> {
  try {
    const snap = await getAdminDb().collection(ITEMS).get();
    return snap.docs
      .map((d) => map(d.id, d.data()))
      .filter((i) => i.src && i.title)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    // The strips have their built-in cards; a database that isn't reachable
    // shouldn't empty the homepage.
    return [];
  }
}

export async function addSectionItem(input: Omit<SectionItem, "id" | "createdAt">): Promise<{ id: string }> {
  const ref = await getAdminDb().collection(ITEMS).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

/** Only the fields the form offers; the section and creation time are fixed. */
export async function updateSectionItem(
  id: string,
  fields: Partial<Omit<SectionItem, "id" | "section" | "createdAt">>,
): Promise<void> {
  await getAdminDb().collection(ITEMS).doc(id).update(fields);
}

export async function deleteSectionItem(id: string): Promise<void> {
  await getAdminDb().collection(ITEMS).doc(id).delete();
}
