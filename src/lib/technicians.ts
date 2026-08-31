import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * The people who actually turn up.
 *
 * A technician was four strings in `admin/data.ts` — enough to print a name
 * beside a booking and nothing else. They are records now, because the field
 * app needs something to sign in against and the office needs to know who is
 * carrying which jobs.
 *
 * The PIN is never stored and never returned: what goes into Firestore is a
 * scrypt hash and its salt, and every read that leaves this module has both
 * stripped off.
 */

const TECHNICIANS = "technicians";

export type Technician = {
  id: string;
  name: string;
  /** Digits only — this is what they sign in with. */
  phone: string;
  city: string;
  /** What they are trained on, as the catalogue names them. */
  skills: string[];
  /** A technician who has left keeps their jobs and loses their login. */
  active: boolean;
  createdAt: number;
};

/** What Firestore holds, secret included. Never leaves this module. */
type StoredTechnician = Omit<Technician, "id" | "createdAt"> & {
  pinHash: string;
  pinSalt: string;
  createdAt?: FirebaseFirestore.Timestamp;
};

/** A phone number as digits, so "98450 11223" and "9845011223" are one person. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  // A number typed with the country code is the same number without it.
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString("hex");
}

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function strip(id: string, data: FirebaseFirestore.DocumentData): Technician {
  return {
    id,
    name: data.name ?? "Technician",
    phone: data.phone ?? "",
    city: data.city ?? "",
    skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
    active: data.active !== false,
    createdAt: toMillis(data.createdAt),
  };
}

/** A url-safe id from a name, so "Ravi Kumar" becomes "ravi-kumar". */
export function technicianSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Everyone on the books, the ones who have left included — for the panel. */
export async function listTechnicians(): Promise<Technician[]> {
  try {
    const snap = await getAdminDb().collection(TECHNICIANS).get();
    return snap.docs
      .map((d) => strip(d.id, d.data()))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // A database that isn't reachable shouldn't empty the assignment dropdown.
    return [];
  }
}

export async function getTechnician(id: string): Promise<Technician | null> {
  const doc = await getAdminDb().collection(TECHNICIANS).doc(id).get();
  return doc.exists ? strip(doc.id, doc.data()!) : null;
}

/** True when a name is already taken, so two technicians can't share an id. */
export async function technicianExists(id: string): Promise<boolean> {
  const doc = await getAdminDb().collection(TECHNICIANS).doc(id).get();
  return doc.exists;
}

export async function addTechnician(input: {
  name: string;
  phone: string;
  pin: string;
  city: string;
  skills: string[];
}): Promise<string> {
  const id = technicianSlug(input.name);
  const pinSalt = randomBytes(16).toString("hex");
  const doc: StoredTechnician = {
    name: input.name,
    phone: normalisePhone(input.phone),
    city: input.city,
    skills: input.skills,
    active: true,
    pinHash: hashPin(input.pin, pinSalt),
    pinSalt,
  };
  await getAdminDb()
    .collection(TECHNICIANS)
    .doc(id)
    .set({ ...doc, createdAt: FieldValue.serverTimestamp() });
  return id;
}

/** Change a technician. A blank `pin` leaves the existing one alone. */
export async function updateTechnician(
  id: string,
  patch: { name?: string; phone?: string; city?: string; skills?: string[]; active?: boolean; pin?: string },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (patch.name) data.name = patch.name;
  if (patch.phone !== undefined) data.phone = normalisePhone(patch.phone);
  if (patch.city !== undefined) data.city = patch.city;
  if (patch.skills) data.skills = patch.skills;
  if (typeof patch.active === "boolean") data.active = patch.active;
  if (patch.pin) {
    const pinSalt = randomBytes(16).toString("hex");
    data.pinSalt = pinSalt;
    data.pinHash = hashPin(patch.pin, pinSalt);
  }
  if (Object.keys(data).length === 0) return;
  await getAdminDb().collection(TECHNICIANS).doc(id).set(data, { merge: true });
}

export async function deleteTechnician(id: string): Promise<void> {
  await getAdminDb().collection(TECHNICIANS).doc(id).delete();
}

/**
 * The sign-in check.
 *
 * Returns the technician on a match and null on anything else — a phone nobody
 * has, a technician who has left, or the wrong PIN. Which of those it was is
 * deliberately not said: a login that distinguishes them is a login that
 * confirms who works here.
 */
export async function verifyTechnicianPin(phone: string, pin: string): Promise<Technician | null> {
  const digits = normalisePhone(phone);
  if (!digits || !pin) return null;

  const snap = await getAdminDb()
    .collection(TECHNICIANS)
    .where("phone", "==", digits)
    .limit(1)
    .get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as StoredTechnician;
  if (data.active === false) return null;
  if (!data.pinHash || !data.pinSalt) return null;

  const attempt = Buffer.from(hashPin(pin, data.pinSalt), "hex");
  const stored = Buffer.from(data.pinHash, "hex");
  if (attempt.length !== stored.length || !timingSafeEqual(attempt, stored)) return null;

  return strip(doc.id, data);
}

/**
 * A short fingerprint of a technician's current PIN.
 *
 * The session carries it, so changing someone's PIN in the panel signs their
 * phone out rather than leaving a cookie that outlives the credential it was
 * issued against.
 */
export async function pinFingerprint(id: string): Promise<string> {
  const doc = await getAdminDb().collection(TECHNICIANS).doc(id).get();
  if (!doc.exists) return "";
  const data = doc.data() as StoredTechnician;
  return createHash("sha256").update(String(data.pinHash ?? "")).digest("hex").slice(0, 12);
}
