import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import { createBooking, type BookingAddress, type BookingItem } from "@/lib/bookings";

/** Matches the form: past these it stops being a household call. */
const MAX_UNITS = 10;
const MAX_ITEMS = 12;

/**
 * Create a booking for the signed-in customer. The customer's identity comes
 * from the verified session cookie — never trusted from the request body.
 */
/** A whole, plausible number of appliances — the body is the browser's claim. */
function cleanUnits(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(MAX_UNITS, Math.max(1, Math.round(value)))
    : 1;
}

/**
 * The appliances on the visit, cut down to what the panel can safely print.
 *
 * A visit that names more than `MAX_ITEMS` appliances is not a household call,
 * and anything that fails to look like an appliance is dropped rather than
 * stored — the panel renders these, and this endpoint takes them from a body.
 */
function cleanItems(value: unknown): BookingItem[] {
  if (!Array.isArray(value)) return [];
  const items: BookingItem[] = [];
  for (const raw of value.slice(0, MAX_ITEMS)) {
    const i = raw as Partial<BookingItem>;
    if (typeof i?.appliance !== "string" || !i.appliance.trim()) continue;
    items.push({
      brand: typeof i.brand === "string" ? i.brand.slice(0, 60) : "",
      appliance: i.appliance.trim().slice(0, 80),
      units: cleanUnits(i.units),
      problem: typeof i.problem === "string" ? i.problem.slice(0, 400) : "",
      ...(typeof i.variant === "string" && i.variant.trim()
        ? { variant: i.variant.trim().slice(0, 60) }
        : {}),
    });
  }
  return items;
}

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
    brand, appliance, units, items, problem, date, slot, payment, price, address, emergency,
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

  const lines = cleanItems(items);

  try {
    const { id, code } = await createBooking({
      uid: user.uid,
      email: user.email,
      customer: a!.fullName || user.name,
      brand,
      appliance,
      // A whole number of appliances, and a plausible one: the body is the
      // browser's claim, and the panel prints what it says.
      units: cleanUnits(units),
      items: lines,
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
