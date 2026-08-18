import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import { saveCart, type SavedCartItem } from "@/lib/carts";

/**
 * Mirror a visitor's basket so the panel can see it.
 *
 * Who the basket belongs to is taken from the session cookie when there is
 * one and is never read from the body; the body only carries the browser's own
 * id, for the baskets built before anyone signs in.
 */

/** A browser id is ours: a uuid we generated. Anything else is not stored. */
const VISITOR = /^[0-9a-f-]{16,64}$/i;

const MAX_ITEMS = 40;

function clean(value: unknown): SavedCartItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  const items: SavedCartItem[] = [];
  for (const raw of value) {
    const i = raw as Partial<SavedCartItem>;
    if (typeof i?.id !== "string" || !i.id || i.id.length > 80) return null;
    if (typeof i.name !== "string" || !i.name) return null;
    if (typeof i.qty !== "number" || !Number.isFinite(i.qty) || i.qty < 1 || i.qty > 99) return null;
    if (typeof i.price !== "number" || !Number.isFinite(i.price) || i.price < 0) return null;
    items.push({
      id: i.id,
      name: i.name.slice(0, 120),
      qty: Math.round(i.qty),
      price: Math.round(i.price),
      ...(i.kind === "plan" ? { kind: "plan" as const } : {}),
      ...(typeof i.problem === "string" && i.problem ? { problem: i.problem.slice(0, 80) } : {}),
      ...(typeof i.problemLabel === "string" && i.problemLabel
        ? { problemLabel: i.problemLabel.slice(0, 120) }
        : {}),
    });
  }
  return items;
}

export async function POST(request: Request) {
  // Nothing to mirror to. The basket still works in the browser, so this is
  // not an error the visitor should ever be shown.
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const items = clean((body as { items?: unknown }).items);
  if (!items) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const user = await getCustomerSession().catch(() => null);
  const visitor = (body as { visitor?: unknown }).visitor;
  const key = user?.uid ?? (typeof visitor === "string" && VISITOR.test(visitor) ? visitor : null);
  if (!key) {
    return NextResponse.json({ ok: false, error: "no_identity" }, { status: 400 });
  }

  try {
    await saveCart({
      key,
      uid: user?.uid,
      email: user?.email,
      name: user?.name,
      picture: user?.picture,
      items,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cart] save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
