import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { BookingStatus } from "@/lib/admin/data";
import { resolveDateKey } from "@/lib/booking-date";

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

/**
 * One appliance on a booking, as words rather than ids.
 *
 * What the office reads is a name and a fault, and the catalogue those ids
 * point at can be renamed after the booking is taken — a record that resolves
 * itself against today's catalogue is a record that changes what it says.
 */
export type BookingItem = {
  brand: string;
  appliance: string;
  /** Front load, split, double door — absent when the appliance has no kinds. */
  variant?: string;
  units: number;
  problem: string;
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
  /** How many of it the visit covers. One unless someone said otherwise. */
  units: number;
  problem: string;
  /**
   * Every appliance on the visit, the one above included and first.
   *
   * The three fields above are that first one, kept flat because everything
   * written before this existed had exactly one and everything that reads a
   * booking expects to find it there.
   */
  items: BookingItem[];
  city: string;
  address: BookingAddress;
  /** The label the customer pressed — "Today", "Sat, 8 Aug". What to print. */
  date: string;
  /**
   * The same day as YYYY-MM-DD. What to sort, compare and group by; the label
   * above can't do either. Bookings taken before this existed have it worked
   * out from the label and `createdAt` when they are read.
   */
  dateKey: string;
  slot: string;
  payment: string;
  price: number;
  status: BookingStatus;
  /** The technician's name, as it is printed beside the booking. */
  tech?: string;
  /**
   * Which technician record that name belongs to.
   *
   * The name alone was enough while a technician was a string in a dropdown.
   * The field app signs somebody in and has to find *their* jobs, and two
   * people can be called Ravi K. — so the id is what a job is really carried
   * by, and the name stays for everything that only prints it.
   */
  techId?: string;
  emergency: boolean;
  createdAt: number;
};

export type NewBooking = {
  uid: string;
  email: string;
  customer: string;
  brand: string;
  appliance: string;
  units?: number;
  problem: string;
  items?: BookingItem[];
  date: string;
  dateKey?: string;
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
    units: input.units ?? 1,
    problem: input.problem,
    items:
      input.items?.length
        ? input.items
        : [
            {
              brand: input.brand,
              appliance: input.appliance,
              units: input.units ?? 1,
              problem: input.problem,
            },
          ],
    city: a.line2 || a.pincode,
    address: a,
    date: input.date,
    dateKey: input.dateKey ?? "",
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
    // Bookings taken before units existed were all for one.
    units: typeof data.units === "number" && data.units > 0 ? data.units : 1,
    problem: data.problem ?? "",
    // Bookings taken before a visit could cover several are that one appliance.
    items: Array.isArray(data.items) && data.items.length
      ? (data.items as BookingItem[])
      : [
          {
            brand: data.brand ?? "",
            appliance: data.appliance ?? "",
            units: typeof data.units === "number" && data.units > 0 ? data.units : 1,
            problem: data.problem ?? "",
          },
        ],
    city: data.city ?? "",
    address: data.address ?? { fullName: "", phone: "", line1: "", pincode: "" },
    date: data.date ?? "",
    dateKey: resolveDateKey(data.date ?? "", data.dateKey, toMillis(data.createdAt)),
    slot: data.slot ?? "",
    payment: data.payment ?? "",
    price: data.price ?? 0,
    status: (data.status ?? "new") as BookingStatus,
    tech: data.tech ?? undefined,
    techId: data.techId ?? undefined,
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
  patch: { status?: BookingStatus; tech?: string | null; techId?: string | null },
): Promise<void> {
  const db = getAdminDb();
  const data: Record<string, unknown> = {};
  if (patch.status) data.status = patch.status;
  if (patch.tech !== undefined) data.tech = patch.tech || FieldValue.delete();
  if (patch.techId !== undefined) data.techId = patch.techId || FieldValue.delete();
  if (Object.keys(data).length === 0) return;
  await db.collection(BOOKINGS).doc(id).update(data);
}

/**
 * One technician's jobs, newest first.
 *
 * Two queries, because bookings assigned before `techId` existed carry only
 * the name. Neither is sorted in Firestore — a `where` plus an `orderBy` wants
 * a composite index, and a technician's list is short enough to sort here.
 */
export async function listTechnicianBookings(techId: string, name: string): Promise<Booking[]> {
  const db = getAdminDb();
  const [byId, byName] = await Promise.all([
    db.collection(BOOKINGS).where("techId", "==", techId).get(),
    name ? db.collection(BOOKINGS).where("tech", "==", name).get() : Promise.resolve(null),
  ]);

  const seen = new Map<string, Booking>();
  for (const doc of byId.docs) seen.set(doc.id, mapBooking(doc.id, doc.data()));
  for (const doc of byName?.docs ?? []) {
    // A job handed to somebody else since keeps their id and this one's name
    // only if the panel wrote one without the other — the id wins.
    const row = mapBooking(doc.id, doc.data());
    if (!seen.has(doc.id) && (!row.techId || row.techId === techId)) seen.set(doc.id, row);
  }

  return [...seen.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * A status change made from the field app.
 *
 * The check that the job is actually theirs happens here rather than in the
 * route: it is the reason this function exists separately from
 * `updateBooking`, and it should not be possible to call the write without it.
 */
export async function setBookingStatusByTech(
  id: string,
  tech: { id: string; name: string },
  status: BookingStatus,
): Promise<"ok" | "not_found" | "not_yours"> {
  const db = getAdminDb();
  const ref = db.collection(BOOKINGS).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return "not_found";

  const data = doc.data()!;
  const mine = data.techId ? data.techId === tech.id : data.tech === tech.name;
  if (!mine) return "not_yours";

  // Taking a job on also claims it by id, so the name match is needed once only.
  await ref.update({ status, techId: tech.id, tech: tech.name });
  return "ok";
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
