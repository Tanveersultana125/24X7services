import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { ActivityEvent } from "@/lib/activity-shared";

export type { ActivityEvent };

/**
 * What visitors do on the site, mirrored to Firestore so the panel can see it.
 *
 * The basket already showed what someone picked. This shows how they got
 * there — the pages they opened and the things they pressed on the way — so a
 * booking that never happened is still something the office can read.
 *
 * One document per visitor rather than one per click. A busy afternoon is
 * thousands of presses, and a collection with a row for each of them costs a
 * read to answer any question worth asking; a visitor's own trail is the unit
 * anyone actually looks at. Each document keeps its last `MAX_EVENTS` and
 * counts everything before them, so a long session tells you both what it
 * ended up doing and how much of it there was.
 *
 * Keyed the same way baskets are: the customer's uid once they sign in, and a
 * random per-browser id before that — so the two lists line up for the same
 * person.
 */

export type VisitorActivity = {
  key: string;
  /** Absent until they sign in. */
  uid?: string;
  email?: string;
  name: string;
  picture?: string;
  guest: boolean;
  /** Newest last — the trail reads in the order it happened. */
  events: ActivityEvent[];
  /** Lifetime totals, including the events that have aged out of the trail. */
  clicks: number;
  views: number;
  firstSeen: number;
  lastSeen: number;
};

const ACTIVITY = "activity";

/** How much of one visitor's trail is kept. Older presses survive as counts. */
export const MAX_EVENTS = 60;

/** How far back the panel looks. Older documents stay but are not listed. */
const LIST_LIMIT = 200;

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : 0;
}

/**
 * Append a batch to a visitor's trail.
 *
 * The browser sends in batches, so one write covers a burst of clicks rather
 * than one write per press. The trail is read back to be trimmed — Firestore
 * can append to an array without reading it, but not drop from the front, and
 * an untrimmed trail grows until the document stops fitting.
 */
export async function recordActivity(input: {
  key: string;
  uid?: string;
  email?: string;
  name?: string;
  picture?: string;
  events: ActivityEvent[];
}): Promise<void> {
  if (input.events.length === 0) return;

  const db = getAdminDb();
  const ref = db.collection(ACTIVITY).doc(input.key);
  const existing = await ref.get();
  const before: ActivityEvent[] = Array.isArray(existing.data()?.events)
    ? (existing.data()!.events as ActivityEvent[])
    : [];

  const clicks = input.events.filter((e) => e.kind === "click").length;

  const doc: Record<string, unknown> = {
    key: input.key,
    guest: !input.uid,
    name: input.name || (input.uid ? "Customer" : "Guest"),
    events: [...before, ...input.events].slice(-MAX_EVENTS),
    clicks: FieldValue.increment(clicks),
    views: FieldValue.increment(input.events.length - clicks),
    lastSeen: FieldValue.serverTimestamp(),
    ...(existing.exists ? {} : { firstSeen: FieldValue.serverTimestamp() }),
  };
  // Firestore rejects undefined, so the optional fields are only attached
  // when there is something to attach.
  if (input.uid) doc.uid = input.uid;
  if (input.email) doc.email = input.email;
  if (input.picture) doc.picture = input.picture;

  await ref.set(doc, { merge: true });
}

function mapVisitor(id: string, data: FirebaseFirestore.DocumentData): VisitorActivity {
  const events: ActivityEvent[] = Array.isArray(data.events) ? data.events : [];
  return {
    key: data.key ?? id,
    uid: data.uid || undefined,
    email: data.email || undefined,
    name: data.name || "Guest",
    picture: data.picture || undefined,
    guest: Boolean(data.guest ?? !data.uid),
    events,
    clicks: typeof data.clicks === "number" ? data.clicks : 0,
    views: typeof data.views === "number" ? data.views : 0,
    firstSeen: toMillis(data.firstSeen),
    lastSeen: toMillis(data.lastSeen),
  };
}

/** Every visitor with a trail, most recently active first (admin). */
export async function listActivity(): Promise<VisitorActivity[]> {
  const db = getAdminDb();
  const snap = await db.collection(ACTIVITY).orderBy("lastSeen", "desc").limit(LIST_LIMIT).get();
  return snap.docs.map((d) => mapVisitor(d.id, d.data()));
}

/** One row per thing pressed, commonest first — what the site is used for. */
export function topPressed(
  visitors: VisitorActivity[],
  kind: ActivityEvent["kind"],
  limit = 8,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of visitors) {
    for (const e of v.events) {
      if (e.kind !== kind) continue;
      const label = kind === "view" ? e.path : e.label || e.href || "(unlabelled)";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
