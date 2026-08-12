import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mergeServiceIndex,
  visibleServiceIndex,
  type ServiceIndexEdit,
  type ServiceIndexEdits,
} from "@/lib/service-index-shared";
import type { Service } from "@/lib/services";

/** Firestore store for the /services index — one doc per row that was changed. */

const EDITS = "serviceIndex";

/**
 * Read on every page render through the layout, so a short cache keeps that
 * from being a round-trip per view. Writes clear it. Held on globalThis
 * because the route that writes and the page that reads are separate module
 * instances.
 */
const TTL_MS = 60_000;
const store = globalThis as typeof globalThis & {
  __24x7ServiceIndex?: { at: number; value: ServiceIndexEdits } | null;
};

async function load(): Promise<ServiceIndexEdits> {
  const cached = store.__24x7ServiceIndex;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const snap = await getAdminDb().collection(EDITS).get();
    const value: ServiceIndexEdits = {};
    for (const doc of snap.docs) value[doc.id] = doc.data() as ServiceIndexEdit;
    store.__24x7ServiceIndex = { at: Date.now(), value };
    return value;
  } catch {
    // The index renders as the code has it if the database is away.
    return {};
  }
}

/** Everything, hidden rows included — for the admin panel. */
export async function getServiceIndexForAdmin() {
  return mergeServiceIndex(await load());
}

/** What the site shows. */
export async function getServiceIndex(): Promise<Service[]> {
  return visibleServiceIndex(mergeServiceIndex(await load()));
}

export async function editServiceIndex(id: string, fields: ServiceIndexEdit): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).set(fields, { merge: true });
  store.__24x7ServiceIndex = null;
}

/** Puts a row back to exactly what the code says. */
export async function resetServiceIndex(id: string): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).delete();
  store.__24x7ServiceIndex = null;
}
