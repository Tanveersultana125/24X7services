import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { BookingStatus } from "@/lib/admin/data";

/**
 * Firestore data layer for customer bookings and customers.
 *
 * Collections:
 *  - `bookings`   — one doc per booking, tied to the signed-in customer (uid/email)
 *  - `customers`  — one doc per customer (keyed by uid), upserted on every login
 *
 * Every function returns plain, JSON-serialisable objects (Timestamps are
 * converted to millis) so results can be handed straight to Client Components.
 */

export type BookingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  pincode: string;
  landmark?: string;
};

/** Shape stored in Firestore + returned to the app (createdAt as epoch millis). */
export type Booking = {
  id: string;
  code: string;
  uid: string;
  email: string;
  customer: string;
  phone: string;
  brand: string;
  appliance: string;
  problem: string;
  city: string;
  address: BookingAddress;
  date: string;
  slot: string;
  payment: string;
  price: number;
  status: BookingStatus;
  tech?: string;
  emergency: boolean;
  createdAt: number;
};

export type NewBooking = {
  uid: string;
  email: string;
  customer: string;
  brand: string;
  appliance: string;
  problem: string;
  date: string;
  slot: string;
  payment: string;
  price: number;
  address: BookingAddress;
  emergency: boolean;
};

export type Customer = {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  bookings: number;
  createdAt: number;
  lastLoginAt: number;
};

const BOOKINGS = "bookings";
const CUSTOMERS = "customers";

/** Human-friendly booking reference, e.g. "24X7-482910". */
function makeCode() {
  return `24X7-${Math.floor(100000 + Math.random() * 899999)}`;
}

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Create a booking and bump the customer's booking counter. Returns id + code. */
export async function createBooking(input: NewBooking): Promise<{ id: string; code: string }> {
  const db = getAdminDb();
  const code = makeCode();
  const a = input.address;

  const ref = await db.collection(BOOKINGS).add({
    code,
    uid: input.uid,
    email: input.email,
    customer: input.customer,
    phone: a.phone,
    brand: input.brand,
    appliance: input.appliance,
    problem: input.problem,
    city: a.line2 || a.pincode,
    address: a,
    date: input.date,
    slot: input.slot,
    payment: input.payment,
    price: input.price,
    status: "new" as BookingStatus,
    emergency: input.emergency,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Keep the customer's booking count in sync (best-effort).
  await db
    .collection(CUSTOMERS)
    .doc(input.uid)
    .set({ bookings: FieldValue.increment(1) }, { merge: true })
    .catch(() => {});

  return { id: ref.id, code };
}

function mapBooking(id: string, data: FirebaseFirestore.DocumentData): Booking {
  return {
    id,
    code: data.code ?? id,
    uid: data.uid ?? "",
    email: data.email ?? "",
    customer: data.customer ?? "Customer",
    phone: data.phone ?? "",
    brand: data.brand ?? "",
    appliance: data.appliance ?? "",
    problem: data.problem ?? "",
    city: data.city ?? "",
    address: data.address ?? { fullName: "", phone: "", line1: "", pincode: "" },
    date: data.date ?? "",
    slot: data.slot ?? "",
    payment: data.payment ?? "",
    price: data.price ?? 0,
    status: (data.status ?? "new") as BookingStatus,
    tech: data.tech ?? undefined,
    emergency: Boolean(data.emergency),
    createdAt: toMillis(data.createdAt),
  };
}

/** All bookings, newest first (admin). */
export async function listBookings(): Promise<Booking[]> {
  const db = getAdminDb();
  const snap = await db.collection(BOOKINGS).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => mapBooking(d.id, d.data()));
}

/** A single customer's bookings, newest first (customer dashboard). */
export async function listCustomerBookings(uid: string): Promise<Booking[]> {
  const db = getAdminDb();
  // No composite index needed: filter by uid, sort in memory.
  const snap = await db.collection(BOOKINGS).where("uid", "==", uid).get();
  return snap.docs
    .map((d) => mapBooking(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Update a booking's status / assigned technician (admin). */
export async function updateBooking(
  id: string,
  patch: { status?: BookingStatus; tech?: string | null },
): Promise<void> {
  const db = getAdminDb();
  const data: Record<string, unknown> = {};
  if (patch.status) data.status = patch.status;
  if (patch.tech !== undefined) data.tech = patch.tech || FieldValue.delete();
  if (Object.keys(data).length === 0) return;
  await db.collection(BOOKINGS).doc(id).update(data);
}

/** Record / refresh a customer on login. Sets `createdAt` only on first sight. */
export async function upsertCustomer(user: {
  uid: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(CUSTOMERS).doc(user.uid);
  const existing = await ref.get();
  await ref.set(
    {
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
      lastLoginAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp(), bookings: 0 }),
    },
    { merge: true },
  );
}

function mapCustomer(id: string, data: FirebaseFirestore.DocumentData): Customer {
  return {
    uid: data.uid ?? id,
    email: data.email ?? "",
    name: data.name ?? "Customer",
    picture: data.picture ?? undefined,
    bookings: data.bookings ?? 0,
    createdAt: toMillis(data.createdAt),
    lastLoginAt: toMillis(data.lastLoginAt),
  };
}

/** All customers, most-recently-active first (admin). */
export async function listCustomers(): Promise<Customer[]> {
  const db = getAdminDb();
  const snap = await db.collection(CUSTOMERS).get();
  return snap.docs
    .map((d) => mapCustomer(d.id, d.data()))
    .sort((a, b) => b.lastLoginAt - a.lastLoginAt);
}
