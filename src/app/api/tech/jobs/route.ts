import { NextResponse } from "next/server";
import { currentTechnician } from "@/lib/tech/auth";
import { setBookingStatusByTech } from "@/lib/bookings";
import type { BookingStatus } from "@/lib/admin/data";

/**
 * The only write the field app makes: where a job has got to.
 *
 * A technician moves a job forward, and can cancel one they cannot do — they
 * cannot mark it new again, and they cannot touch a job that is not theirs
 * (`setBookingStatusByTech` is what enforces that, not this route).
 */
const ALLOWED: BookingStatus[] = ["assigned", "in-progress", "completed", "cancelled"];

export async function PATCH(request: Request) {
  const tech = await currentTechnician();
  if (!tech) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? (body.status as BookingStatus) : null;

  if (!id || !status || !ALLOWED.includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await setBookingStatusByTech(id, { id: tech.id, name: tech.name }, status);
    if (result === "not_found") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (result === "not_yours") {
      return NextResponse.json({ ok: false, error: "not_yours" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tech/jobs] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
