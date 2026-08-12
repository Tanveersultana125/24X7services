import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * Images uploaded from the admin panel that aren't tied to a position yet.
 *
 * A slot holds one photo at a time; this is the shelf everything else sits on
 * — upload once, then point any slot or card at it with "Use a URL".
 */

export type MediaImage = {
  id: string;
  url: string;
  name: string;
  /**
   * The page it was uploaded on. A shelf shared by every page meant a photo
   * uploaded for one strip sat on top of all four, with nothing to say which
   * it was for.
   */
  group: string;
  createdAt: number;
};

/** Where anything uploaded before the shelf was split ends up. */
const UNGROUPED = "Page sections";

const MEDIA = "media";

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** One page's shelf, newest first — the one just uploaded is the one wanted. */
export async function listMedia(group: string): Promise<MediaImage[]> {
  try {
    const snap = await getAdminDb().collection(MEDIA).get();
    return snap.docs
      .map((d) => ({
        id: d.id,
        url: d.data().url ?? "",
        name: d.data().name ?? "Untitled",
        group: d.data().group ?? UNGROUPED,
        createdAt: toMillis(d.data().createdAt),
      }))
      .filter((m) => m.url && m.group === group)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function addMedia(input: {
  url: string;
  name: string;
  group: string;
}): Promise<{ id: string }> {
  const ref = await getAdminDb().collection(MEDIA).add({
    url: input.url,
    name: input.name,
    group: input.group,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function deleteMedia(id: string): Promise<void> {
  await getAdminDb().collection(MEDIA).doc(id).delete();
}
