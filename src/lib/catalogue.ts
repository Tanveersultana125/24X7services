import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mergeCatalogue,
  visibleServices,
  type CatalogueService,
  type ServiceEdit,
  type ServiceEdits,
} from "@/lib/catalogue-shared";

/**
 * Where the catalogue's changes live.
 *
 * Two collections, for the two different things an admin does: `serviceEdits`
 * holds what was changed about a service that ships with the build, keyed by
 * its id; `serviceAdditions` holds services that exist only here. Keeping them
 * apart is what lets "reset" mean something — delete the edit and the built-in
 * comes back exactly as the code has it.
 */

const EDITS = "serviceEdits";
const ADDED = "serviceAdditions";

/**
 * Read on every page render, so a short cache keeps that from being two
 * round-trips per view. Writes clear it. On globalThis because the route that
 * writes and the page that reads are separate module instances.
 */
const TTL_MS = 60_000;
const store = globalThis as typeof globalThis & {
  __24x7Catalogue?: { at: number; value: CatalogueService[] } | null;
};

async function load(): Promise<CatalogueService[]> {
  const cached = store.__24x7Catalogue;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const db = getAdminDb();
    const [editSnap, addedSnap] = await Promise.all([
      db.collection(EDITS).get(),
      db.collection(ADDED).get(),
    ]);

    const edits: ServiceEdits = {};
    for (const doc of editSnap.docs) edits[doc.id] = doc.data() as ServiceEdit;

    const added = addedSnap.docs.map((doc) => ({
      ...(doc.data() as Omit<CatalogueService, "id">),
      id: doc.id,
      custom: true as const,
    }));

    const value = mergeCatalogue(edits, added);
    store.__24x7Catalogue = { at: Date.now(), value };
    return value;
  } catch {
    // A database that isn't reachable shouldn't take the whole catalogue with
    // it — what ships with the build is a perfectly good answer.
    return mergeCatalogue({}, []);
  }
}

/** Everything, hidden ones included — for the admin panel. */
export function getCatalogue(): Promise<CatalogueService[]> {
  return load();
}

/** What the site shows. */
export async function getServices(): Promise<CatalogueService[]> {
  return visibleServices(await load());
}

export async function editService(id: string, fields: ServiceEdit): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).set(fields, { merge: true });
  store.__24x7Catalogue = null;
}

/** Puts a built-in service back to exactly what the code says. */
export async function resetService(id: string): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).delete();
  store.__24x7Catalogue = null;
}

export async function addService(id: string, service: Omit<CatalogueService, "id">): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(service);
  store.__24x7Catalogue = null;
}

export async function updateAddedService(id: string, fields: Partial<CatalogueService>): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(fields, { merge: true });
  store.__24x7Catalogue = null;
}

export async function deleteAddedService(id: string): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).delete();
  store.__24x7Catalogue = null;
}

/** True when an id is already taken, so two services can't share one. */
export async function serviceExists(id: string): Promise<boolean> {
  const all = await load();
  return all.some((s) => s.id === id);
}
