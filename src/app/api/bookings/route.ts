import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import { createBooking, type BookingAddress } from "@/lib/bookings";

/**
 * Create a booking for the signed-in customer. The customer's identity comes
 * from the verified session cookie — never trusted from the request body.
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

  const {
    brand, appliance, problem, date, slot, payment, price, address, emergency,
  } = body as Record<string, unknown>;

  const a = address as Partial<BookingAddress> | undefined;
  const valid =
    typeof brand === "string" &&
    typeof appliance === "string" &&
    typeof date === "string" &&
    typeof slot === "string" &&
    typeof payment === "string" &&
    typeof price === "number" &&
    a && typeof a.fullName === "string" && typeof a.phone === "string" &&
    typeof a.line1 === "string" && typeof a.pincode === "string";

  if (!valid) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const { id, code } = await createBooking({
      uid: user.uid,
      email: user.email,
      customer: a!.fullName || user.name,
      brand,
      appliance,
      problem: typeof problem === "string" ? problem : "",
      date,
      slot,
      payment,
      price,
      emergency: Boolean(emergency),
      address: {
        fullName: a!.fullName!,
        phone: a!.phone!,
        line1: a!.line1!,
        line2: typeof a!.line2 === "string" ? a!.line2 : undefined,
        pincode: a!.pincode!,
        landmark: typeof a!.landmark === "string" ? a!.landmark : undefined,
      },
    });
    return NextResponse.json({ ok: true, id, code });
  } catch (err) {
    console.error("[bookings] create failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
