import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import {
  createReviewForBooking,
  createSiteReview,
  REVIEW_MAX_LENGTH,
  REVIEW_MIN_LENGTH,
} from "@/lib/reviews";

/**
 * Leave a review.
 *
 * With a `bookingId` the review is tied to that booking: identity comes from
 * the session cookie, the customer details are copied off the booking
 * server-side, and it is stored verified.
 *
 * Without one, anyone can review the service. Those are stored unverified and,
 * like every review, stay invisible until an admin publishes them.
 */

const NAME_MIN = 2;
const NAME_MAX = 60;
const FIELD_MAX = 60;

/** Best-effort throttle on open reviews. Per instance only — it slows spam, it doesn't stop it. */
const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { bookingId, rating, text: raw, name, city, service } = body as Record<string, unknown>;
  const trimmed = typeof raw === "string" ? raw.trim() : "";

  const ratingOk = typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
  const textOk = trimmed.length >= REVIEW_MIN_LENGTH && trimmed.length <= REVIEW_MAX_LENGTH;
  if (!ratingOk || !textOk) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const user = await getCustomerSession();

  // ---- tied to one of the customer's own bookings ----
  if (typeof bookingId === "string" && bookingId.length > 0) {
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    try {
      const result = await createReviewForBooking({
        uid: user.uid,
        bookingId,
        rating,
        text: trimmed,
      });

      if (!result.ok) {
        const status = result.reason === "not_found" ? 404 : result.reason === "forbidden" ? 403 : 409;
        return NextResponse.json({ ok: false, error: result.reason }, { status });
      }

      return NextResponse.json({ ok: true, id: result.id, verified: true });
    } catch (err) {
      console.error("[reviews] create failed:", err);
      return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
    }
  }

  // ---- written straight from the site, no booking behind it ----
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip, Date.now())) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // A signed-in customer reviews under their account name — never a name typed
  // into the request, which anyone could set to anyone.
  const displayName = user?.name?.trim() || text(name, NAME_MAX);
  if (displayName.length < NAME_MIN) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }

  try {
    const result = await createSiteReview({
      uid: user?.uid,
      name: displayName,
      city: text(city, FIELD_MAX),
      service: text(service, FIELD_MAX),
      rating,
      text: trimmed,
    });
    return NextResponse.json({ ok: true, id: result.id, verified: false });
  } catch (err) {
    console.error("[reviews] site review failed:", err);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
