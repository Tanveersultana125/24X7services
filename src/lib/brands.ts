import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mergeBrands,
  visibleBrands,
  type AdminBrand,
  type BrandEdit,
  type BrandEdits,
} from "@/lib/brands-shared";

/**
 * Where the brand list's changes live.
 *
 * Two collections, for the two different things an admin does: `brandEdits`
 * holds what was changed about a make that ships with the build, keyed by its
 * id; `brandAdditions` holds companies that exist only here. Keeping them apart
 * is what lets "reset" mean something — delete the edit and the built-in comes
 * back exactly as the code has it.
 */

const EDITS = "brandEdits";
const ADDED = "brandAdditions";

/**
 * Read on every page render, so a short cache keeps that from being two
 * round-trips per view. Writes clear it. On globalThis because the route that
 * writes and the page that reads are separate module instances.
 */
const TTL_MS = 60_000;
const store = globalThis as typeof globalThis & {
  __24x7Brands?: { at: number; value: AdminBrand[] } | null;
};

async function load(): Promise<AdminBrand[]> {
  const cached = store.__24x7Brands;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const db = getAdminDb();
    const [editSnap, addedSnap] = await Promise.all([
      db.collection(EDITS).get(),
      db.collection(ADDED).get(),
    ]);

    const edits: BrandEdits = {};
    for (const doc of editSnap.docs) edits[doc.id] = doc.data() as BrandEdit;

    const added = addedSnap.docs.map((doc) => ({
      ...(doc.data() as Omit<AdminBrand, "id">),
      id: doc.id,
      custom: true as const,
    }));

    const value = mergeBrands(edits, added);
    store.__24x7Brands = { at: Date.now(), value };
    return value;
  } catch {
    // A database that isn't reachable shouldn't take the brand list with it —
    // what ships with the build is a perfectly good answer.
    return mergeBrands({}, []);
  }
}

/** Everything, hidden ones included — for the admin panel. */
export function getAllBrands(): Promise<AdminBrand[]> {
  return load();
}

/** What the site shows. */
export async function getBrands(): Promise<AdminBrand[]> {
  return visibleBrands(await load());
}

export async function editBrand(id: string, fields: BrandEdit): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).set(fields, { merge: true });
  store.__24x7Brands = null;
}

/** Puts a built-in make back to exactly what the code says. */
export async function resetBrand(id: string): Promise<void> {
  await getAdminDb().collection(EDITS).doc(id).delete();
  store.__24x7Brands = null;
}

export async function addBrand(id: string, brand: Omit<AdminBrand, "id">): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(brand);
  store.__24x7Brands = null;
}

export async function updateAddedBrand(id: string, fields: Partial<AdminBrand>): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).set(fields, { merge: true });
  store.__24x7Brands = null;
}

export async function deleteAddedBrand(id: string): Promise<void> {
  await getAdminDb().collection(ADDED).doc(id).delete();
  store.__24x7Brands = null;
}

/** True when an id is already taken, so two makes can't share one. */
export async function brandExists(id: string): Promise<boolean> {
  const all = await load();
  return all.some((b) => b.id === id);
}
