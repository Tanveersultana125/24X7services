import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * Baskets, mirrored to Firestore so the panel can see them.
 *
 * The basket itself still lives in the visitor's browser — that is what makes
 * it survive a refresh without an account. This is a copy of it, written on
 * every change, so the office can see what people are picking before they book
 * and follow up on the ones that stall.
 *
 * One document per basket, keyed by the customer's uid when they are signed in
 * and by a random per-browser id when they are not. An emptied basket deletes
 * its document rather than lingering as a row with nothing in it.
 */

export type SavedCartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  kind?: "service" | "plan";
  problem?: string;
  problemLabel?: string;
};

export type SavedCart = {
  key: string;
  /** Absent on a basket built before signing in. */
  uid?: string;
  email?: string;
  name: string;
  picture?: string;
  /** True while nobody has signed in on that browser. */
  guest: boolean;
  items: SavedCartItem[];
  count: number;
  total: number;
  createdAt: number;
  updatedAt: number;
};

const CARTS = "carts";

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/**
 * Write a basket, or delete it when it is empty.
 *
 * `undefined` is not a value Firestore accepts, so the optional fields are
 * only attached when there is something to attach.
 */
export async function saveCart(input: {
  key: string;
  uid?: string;
  email?: string;
  name?: string;
  picture?: string;
  items: SavedCartItem[];
}): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(CARTS).doc(input.key);

  if (input.items.length === 0) {
    await ref.delete().catch(() => {});
    return;
  }

  const existing = await ref.get();
  const doc: Record<string, unknown> = {
    key: input.key,
    guest: !input.uid,
    name: input.name || (input.uid ? "Customer" : "Guest"),
    items: input.items,
    count: input.items.reduce((n, i) => n + i.qty, 0),
    total: input.items.reduce((sum, i) => sum + i.price, 0),
    updatedAt: FieldValue.serverTimestamp(),
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };
  if (input.uid) doc.uid = input.uid;
  if (input.email) doc.email = input.email;
  if (input.picture) doc.picture = input.picture;

  await ref.set(doc, { merge: true });
}

function mapCart(id: string, data: FirebaseFirestore.DocumentData): SavedCart {
  const items: SavedCartItem[] = Array.isArray(data.items) ? data.items : [];
  return {
    key: data.key ?? id,
    uid: data.uid || undefined,
    email: data.email || undefined,
    name: data.name || "Guest",
    picture: data.picture || undefined,
    guest: Boolean(data.guest ?? !data.uid),
    items,
    count: typeof data.count === "number" ? data.count : items.reduce((n, i) => n + i.qty, 0),
    total: typeof data.total === "number" ? data.total : items.reduce((s, i) => s + i.price, 0),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/** Every live basket, most recently touched first (admin). */
export async function listCarts(): Promise<SavedCart[]> {
  const db = getAdminDb();
  const snap = await db.collection(CARTS).orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => mapCart(d.id, d.data()));
}
