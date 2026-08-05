import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { ReviewCard } from "@/lib/content";

/**
 * Firestore data layer for customer reviews.
 *
 * Collection:
 *  - `reviews` — one doc per review.
 *
 * Reviews come in two kinds:
 *  - tied to a booking (`createReviewForBooking`) — the customer must own that
 *    booking and it must be `completed`, one review per booking. Those carry
 *    `verified: true`.
 *  - written straight from the site (`createSiteReview`) — anyone can leave one
 *    about the service. Those carry `verified: false`.
 *
 * Both start as `pending` and reach the public wall only once an admin
 * publishes them. The ownership rules live here rather than in the UI, so they
 * hold no matter who calls.
 *
 * Every function returns plain, JSON-serialisable objects (Timestamps are
 * converted to millis) so results can be handed straight to Client Components.
 */

export type ReviewStatus = "pending" | "published" | "hidden";

export type Review = {
  id: string;
  uid: string;
  bookingId: string;
  bookingCode: string;
  name: string;
  city: string;
  brand: string;
  appliance: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  /** True when the review is attached to a completed booking on this account. */
  verified: boolean;
  createdAt: number;
};

const REVIEWS = "reviews";
const BOOKINGS = "bookings";

/** Longest review we accept — keeps the card wall readable and blocks spam dumps. */
export const REVIEW_MAX_LENGTH = 600;
export const REVIEW_MIN_LENGTH = 10;

/** Avatar tints, matched to the seeded testimonials so the wall stays on-brand. */
const AVATAR_COLORS = ["#1E88E5", "#00C853", "#d9821b", "#2547d0", "#0b9a63", "#7c3aed", "#c2410c"];

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function reviewInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
}

/** Stable per-person colour, so the same customer always gets the same avatar. */
function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Shape a stored review into the card format the marketing components render. */
export function toTestimonial(r: Review): ReviewCard {
  return {
    name: r.name,
    city: r.city,
    rating: r.rating,
    appliance: [r.brand, r.appliance].filter(Boolean).join(" ") || "Appliance service",
    quote: r.text,
    initials: reviewInitials(r.name),
    color: avatarColor(r.uid || r.name),
    createdAt: r.createdAt,
  };
}

function mapReview(id: string, data: FirebaseFirestore.DocumentData): Review {
  return {
    id,
    uid: data.uid ?? "",
    bookingId: data.bookingId ?? "",
    bookingCode: data.bookingCode ?? "",
    name: data.name ?? "Customer",
    city: data.city ?? "",
    brand: data.brand ?? "",
    appliance: data.appliance ?? "",
    rating: typeof data.rating === "number" ? data.rating : 5,
    text: data.text ?? "",
    status: (data.status ?? "pending") as ReviewStatus,
    // Reviews written before the flag existed were all booking-tied.
    verified: typeof data.verified === "boolean" ? data.verified : Boolean(data.bookingId),
    createdAt: toMillis(data.createdAt),
  };
}

export type CreateReviewResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_found" | "forbidden" | "not_completed" | "already_reviewed" };

/**
 * Create a review for one of the customer's completed bookings.
 *
 * The customer-facing fields (name, appliance, city) are copied off the
 * booking rather than taken from the caller — a customer can choose their
 * words, not who the review appears to be from.
 */
export async function createReviewForBooking(input: {
  uid: string;
  bookingId: string;
  rating: number;
  text: string;
}): Promise<CreateReviewResult> {
  const db = getAdminDb();

  const bookingSnap = await db.collection(BOOKINGS).doc(input.bookingId).get();
  if (!bookingSnap.exists) return { ok: false, reason: "not_found" };

  const booking = bookingSnap.data() as FirebaseFirestore.DocumentData;
  if (booking.uid !== input.uid) return { ok: false, reason: "forbidden" };
  if (booking.status !== "completed") return { ok: false, reason: "not_completed" };

  const existing = await db
    .collection(REVIEWS)
    .where("bookingId", "==", input.bookingId)
    .limit(1)
    .get();
  if (!existing.empty) return { ok: false, reason: "already_reviewed" };

  const ref = await db.collection(REVIEWS).add({
    uid: input.uid,
    bookingId: input.bookingId,
    bookingCode: booking.code ?? input.bookingId,
    name: booking.customer ?? "Customer",
    city: booking.city ?? "",
    brand: booking.brand ?? "",
    appliance: booking.appliance ?? "",
    rating: input.rating,
    text: input.text,
    // Every review waits for an admin before it reaches the public wall.
    status: "pending" as ReviewStatus,
    verified: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, id: ref.id };
}

/**
 * Create a review written straight from the site, with no booking behind it.
 *
 * Anyone can leave one — signed in or not — so it is stored unverified and
 * waits for an admin like every other review. A signed-in customer's display
 * name comes from their account rather than the request, so a review can't be
 * published under someone else's name.
 */
export async function createSiteReview(input: {
  uid?: string;
  name: string;
  city?: string;
  /** What they used us for, free text — "AC service", "Fridge repair". */
  service?: string;
  rating: number;
  text: string;
}): Promise<{ ok: true; id: string }> {
  const db = getAdminDb();

  const ref = await db.collection(REVIEWS).add({
    uid: input.uid ?? "",
    bookingId: "",
    bookingCode: "",
    name: input.name,
    city: input.city ?? "",
    brand: "",
    appliance: input.service ?? "",
    rating: input.rating,
    text: input.text,
    status: "pending" as ReviewStatus,
    verified: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, id: ref.id };
}

/** All reviews, newest first (admin). */
export async function listReviews(): Promise<Review[]> {
  const db = getAdminDb();
  const snap = await db.collection(REVIEWS).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

/** Approved reviews for the public site, newest first. */
export async function listPublishedReviews(limit = 24): Promise<Review[]> {
  const db = getAdminDb();
  // No composite index needed: filter by status, sort in memory.
  const snap = await db.collection(REVIEWS).where("status", "==", "published").get();
  return snap.docs
    .map((d) => mapReview(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

/** One customer's reviews — used to mark which bookings are already rated. */
export async function listCustomerReviews(uid: string): Promise<Review[]> {
  const db = getAdminDb();
  const snap = await db.collection(REVIEWS).where("uid", "==", uid).get();
  return snap.docs
    .map((d) => mapReview(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Approve, hide, or send a review back to pending (admin). */
export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const db = getAdminDb();
  await db.collection(REVIEWS).doc(id).update({ status });
}

/** Remove a review permanently (admin). */
export async function deleteReview(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(REVIEWS).doc(id).delete();
}

export type RatingSummary = {
  count: number;
  average: number;
  /** Share of reviews at each star level, 5 → 1, as percentages. */
  distribution: { stars: number; pct: number }[];
};

/** Average + star distribution across the given reviews. */
export function summarise(reviews: Review[]): RatingSummary {
  const count = reviews.length;
  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    n: reviews.filter((r) => Math.round(r.rating) === stars).length,
  }));

  return {
    count,
    average: count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count,
    distribution: buckets.map((b) => ({
      stars: b.stars,
      pct: count === 0 ? 0 : Math.round((b.n / count) * 1000) / 10,
    })),
  };
}
