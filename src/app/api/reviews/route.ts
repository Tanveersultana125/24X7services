import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import {
  createReviewForBooking,
  REVIEW_MAX_LENGTH,
  REVIEW_MIN_LENGTH,
} from "@/lib/reviews";

/**
 * Leave a review for one of your own completed bookings.
 *
 * Identity comes from the verified session cookie and the review's customer
 * details are copied off the booking server-side — the request body only
 * carries which booking, how many stars, and what was written.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const user = await getCustomerSession();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { bookingId, rating, text } = body as Record<string, unknown>;
  const trimmed = typeof text === "string" ? text.trim() : "";

  const valid =
    typeof bookingId === "string" &&
    bookingId.length > 0 &&
    typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5 &&
    trimmed.length >= REVIEW_MIN_LENGTH &&
    trimmed.length <= REVIEW_MAX_LENGTH;

  if (!valid) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await createReviewForBooking({
      uid: user.uid,
      bookingId: bookingId as string,
      rating: rating as number,
      text: trimmed,
    });

    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : result.reason === "forbidden" ? 403 : 409;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    console.error("[reviews] create failed:", err);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
