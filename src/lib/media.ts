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
  createdAt: number;
};

const MEDIA = "media";

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Newest first — the one just uploaded is the one being looked for. */
export async function listMedia(): Promise<MediaImage[]> {
  try {
    const snap = await getAdminDb().collection(MEDIA).get();
    return snap.docs
      .map((d) => ({
        id: d.id,
        url: d.data().url ?? "",
        name: d.data().name ?? "Untitled",
        createdAt: toMillis(d.data().createdAt),
      }))
      .filter((m) => m.url)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function addMedia(input: { url: string; name: string }): Promise<{ id: string }> {
  const ref = await getAdminDb().collection(MEDIA).add({
    url: input.url,
    name: input.name,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function deleteMedia(id: string): Promise<void> {
  await getAdminDb().collection(MEDIA).doc(id).delete();
}
