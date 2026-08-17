import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mergeServiceIndex,
  mergeServiceIndexCopy,
  visibleServiceIndex,
  type ServiceIndexAddition,
  type ServiceIndexCopy,
  type ServiceIndexEdit,
  type ServiceIndexEdits,
  type ServiceIndexRow,
} from "@/lib/service-index-shared";
import type { Service } from "@/lib/services";

/**
 * Where the /services index keeps its changes.
 *
 * Three collections for the three kinds of change: `serviceIndex` holds edits
 * to rows that ship with the build, `serviceIndexAdditions` holds rows that
 * exist only here, and `serviceIndexCopy` holds the section's own words.
 * Keeping edits apart from additions is what lets "reset" put a shipped row
 * back exactly as the code has it, while an added row can be deleted for good.
 */

const EDITS = "serviceIndex";
const ADDED = "serviceIndexAdditions";
const COPY = "serviceIndexCopy";
const COPY_DOC = "services-page";

type Loaded = { rows: ServiceIndexRow[]; copy: ServiceIndexCopy };

/**
 * Read on every page render through the layout, so a short cache keeps that
 * from being a round-trip per view. Writes clear it. Held on globalThis
 * because the route that writes and the page that reads are separate module
 * instances.
 */
const TTL_MS = 60_000;
const store = globalThis as typeof globalThis & {
  __24x7ServiceIndex?: { at: number; value: Loaded } | null;
};

async function load(): Promise<Loaded> {
  const cached = store.__24x7ServiceIndex;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const db = getAdminDb();
    const [editSnap, addedSnap, copyDoc] = await Promise.all([
      db.collection(EDITS).get(),
      db.collection(ADDED).get(),
      db.collection(COPY).doc(COPY_DOC).get(),
    ]);

    const edits: ServiceIndexEdits = {};
    for (const doc of editSnap.docs) edits[doc.id] = doc.data() as ServiceIndexEdit;

    const added = addedSnap.docs.map((doc) => ({
      ...(doc.data() as ServiceIndexAddition),
      id: doc.id,
    }));

    const value: Loaded = {
      rows: mergeServiceIndex(edits, added),
      copy: mergeServiceIndexCopy(copyDoc.data() as Partial<ServiceIndexCopy> | undefined),
    };
    store.__24x7ServiceIndex = { at: Date.now(), value };
    return value;
  } catch {
    // The index renders as the code has it if the database is away.
    return { rows: mergeServiceIndex({}, []), copy: mergeServiceIndexCopy(null) };
  }
}

function clear() {
  store.__24x7ServiceIndex = null;
}

/** Everything, hidden rows included, plus the section's words — for the panel. */
export async function getServiceIndexForAdmin(): Promise<Loaded> {
  return load();
}

/** What the site shows. */
export async function getServiceIndex(): Promise<Service[]> {
  return visibleServiceIndex((await load()).rows);
}

/** The words around the index. */
export async function getServiceIndexCopy(): Promise<ServiceIndexCopy> {
  return (await load()).copy;
}

/** True when a row was added here rather than shipped in the build. */
export async function isAddedServiceIndexRow(id: string): Promise<boolean> {
  return (await load()).rows.some((r) => r.id === id && r.custom);
}

/** Every id in use, so a new row can't take one that is taken. */
export async function serviceIndexIds(): Promise<string[]> {
  return (await load()).rows.map((r) => r.id);
}

export async function editServiceIndex(id: string, fields: ServiceIndexEdit): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).set(fields, { merge: true });
  clear();
}

/** Puts a shipped row back to exactly what the code says. */
export async function resetServiceIndex(id: string): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).delete();
  clear();
}

export async function addServiceIndexRow(id: string, row: ServiceIndexAddition): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(row);
  clear();
}

export async function updateServiceIndexRow(
  id: string,
  fields: Partial<ServiceIndexAddition>,
): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(fields, { merge: true });
  clear();
}

/** An added row leaves for good — there is no code version to fall back to. */
export async function deleteServiceIndexRow(id: string): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).delete();
  clear();
}

export async function editServiceIndexCopy(fields: Partial<ServiceIndexCopy>): Promise<void> {
  await getAdminDb().collection(COPY).doc(COPY_DOC).set(fields, { merge: true });
  clear();
}

/** Puts the section's words back to the ones in the code. */
export async function resetServiceIndexCopy(): Promise<void> {
  await getAdminDb().collection(COPY).doc(COPY_DOC).delete();
  clear();
}
