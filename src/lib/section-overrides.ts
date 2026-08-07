import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SectionOverride, SectionOverrides } from "@/lib/section-overrides-shared";

/**
 * Firestore store for changes to the built-in strip cards — see
 * `section-overrides-shared.ts` for why they live here rather than in the code.
 */

const OVERRIDES = "sectionOverrides";

/**
 * Read on every page render through the layout, so a short cache keeps that
 * from being a round-trip per view. Writes clear it. Held on globalThis
 * because the route that writes and the page that reads are separate module
 * instances.
 */
const TTL_MS = 60_000;
const store = globalThis as typeof globalThis & {
  __24x7SectionOverrides?: { at: number; value: SectionOverrides } | null;
};

export async function getSectionOverrides(): Promise<SectionOverrides> {
  const cached = store.__24x7SectionOverrides;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const snap = await getAdminDb().collection(OVERRIDES).get();
    const value: SectionOverrides = {};
    for (const doc of snap.docs) value[doc.id] = doc.data() as SectionOverride;
    store.__24x7SectionOverrides = { at: Date.now(), value };
    return value;
  } catch {
    // The strips render their built-in cards unchanged if the database is away.
    return {};
  }
}

export async function setSectionOverride(key: string, fields: SectionOverride): Promise<void> {
  await getAdminDb().collection(OVERRIDES).doc(key).set(fields, { merge: true });
  store.__24x7SectionOverrides = null;
}

/** Puts the card back to exactly what the code says. */
export async function clearSectionOverride(key: string): Promise<void> {
  await getAdminDb().collection(OVERRIDES).doc(key).delete();
  store.__24x7SectionOverrides = null;
}
