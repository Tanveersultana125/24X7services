import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { updateBooking } from "@/lib/bookings";
import type { BookingStatus } from "@/lib/admin/data";

const STATUSES: BookingStatus[] = ["new", "assigned", "in-progress", "completed", "cancelled"];

/** Update a booking's status / assigned technician. Admin session required. */
export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!body || typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const patch: { status?: BookingStatus; tech?: string | null } = {};
  if (typeof body.status === "string" && STATUSES.includes(body.status as BookingStatus)) {
    patch.status = body.status as BookingStatus;
  }
  if (body.tech === null || typeof body.tech === "string") {
    patch.tech = body.tech;
  }

  try {
    await updateBooking(id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/bookings] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
