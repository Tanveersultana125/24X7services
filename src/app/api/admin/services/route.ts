import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import type { BrandId } from "@/lib/types";
import {
  addService,
  deleteAddedService,
  editService,
  resetService,
  serviceExists,
  updateAddedService,
} from "@/lib/catalogue";
import {
  BRAND_IDS,
  DEFAULT_SERVICES,
  slugify,
  type CatalogueService,
  type ServiceEdit,
  type ServiceProblem,
  type ServiceTier,
} from "@/lib/catalogue-shared";

/**
 * The service catalogue: change one that ships with the build, add one of
 * your own, or take an added one away. Admin session required.
 *
 * A built-in and an added service are edited through the same PATCH — which
 * collection the change lands in is decided here, not by the caller.
 */

const BUILT_IN = new Set(DEFAULT_SERVICES.map((s) => s.id));
const MAX_TEXT = 120;
const MAX_PROBLEMS = 24;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : undefined;
}

function num(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Anything that isn't a well-formed problem is dropped rather than stored half-valid. */
function problems(value: unknown): ServiceProblem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: ServiceProblem[] = [];
  for (const raw of value.slice(0, MAX_PROBLEMS)) {
    const label = text((raw as { label?: unknown })?.label);
    if (!label) continue;
    const p = raw as { id?: unknown; price?: unknown; eta?: unknown; common?: unknown };
    const band = Array.isArray(p.price) ? p.price.map(num) : [];
    const low = band[0] ?? 0;
    const high = band[1] ?? low;
    out.push({
      id: text(p.id) || slugify(label) || `problem-${out.length + 1}`,
      label,
      price: [Math.max(0, low), Math.max(low, high)],
      eta: text(p.eta) || "60 min",
      ...(p.common === true ? { common: true } : {}),
    });
  }
  return out;
}

/** Only the brands we actually list — anything else is dropped. */
function brands(value: unknown): BrandId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const known = new Set<string>(BRAND_IDS);
  return value.filter((b): b is BrandId => typeof b === "string" && known.has(b));
}

/** A price per make, keeping only the makes we list and the numbers that parse. */
function brandPrices(value: unknown): Partial<Record<BrandId, number>> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Partial<Record<BrandId, number>> = {};
  for (const id of BRAND_IDS) {
    const n = num((value as Record<string, unknown>)[id]);
    if (n !== undefined && n > 0) out[id] = Math.round(n);
  }
  return out;
}

/** Per-repair bands, keyed by make then by problem, with the junk dropped. */
function brandProblemPrices(
  value: unknown,
): Partial<Record<BrandId, Record<string, [number, number]>>> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Partial<Record<BrandId, Record<string, [number, number]>>> = {};
  for (const id of BRAND_IDS) {
    const rows = (value as Record<string, unknown>)[id];
    if (!rows || typeof rows !== "object") continue;
    const kept: Record<string, [number, number]> = {};
    for (const [problem, band] of Object.entries(rows as Record<string, unknown>)) {
      if (!Array.isArray(band)) continue;
      const low = num(band[0]);
      const high = num(band[1]);
      if (low === undefined || low <= 0) continue;
      kept[problem.slice(0, 60)] = [Math.round(low), Math.round(Math.max(low, high ?? low))];
    }
    // Stored even when empty: the panel sends the whole map every time, so an
    // empty one is how "I cleared these" arrives. Skipping it would merge the
    // old prices straight back and the clearing would never stick.
    out[id] = kept;
  }
  return out;
}

/** Repairs that belong to one make, validated the same way as the shared ones. */
function brandProblems(value: unknown): Partial<Record<BrandId, ServiceProblem[]>> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Partial<Record<BrandId, ServiceProblem[]>> = {};
  for (const id of BRAND_IDS) {
    const list = problems((value as Record<string, unknown>)[id]);
    // An empty list means the last custom repair was removed — see above.
    if (list) out[id] = list;
  }
  return out;
}

/** Quantity tiers, dropping any row that doesn't at least name a price. */
function tiers(value: unknown): ServiceTier[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: ServiceTier[] = [];
  for (const raw of value.slice(0, 8)) {
    const row = raw as { qty?: unknown; price?: unknown; was?: unknown; badge?: unknown };
    const price = num(row.price);
    if (price === undefined || price <= 0) continue;
    const qty = num(row.qty);
    const was = num(row.was);
    out.push({
      qty: Math.max(1, Math.round(qty ?? out.length + 1)),
      price: Math.round(price),
      // A "was" at or below the price is not a saving, so it isn't kept.
      ...(was !== undefined && was > price ? { was: Math.round(was) } : {}),
      ...(text(row.badge) ? { badge: text(row.badge) } : {}),
    });
  }
  return out;
}

/** The ticked list, empty strings dropped. */
function highlights(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, 12)
    .map((h) => text(h))
    .filter((h): h is string => Boolean(h));
}

/** The fields shared by adding and editing, taken only if present. */
function fields(body: Record<string, unknown>): ServiceEdit {
  const out: ServiceEdit = {};
  const name = text(body.name);
  if (name) out.name = name;
  const blurb = text(body.blurb);
  if (blurb !== undefined) out.blurb = blurb;
  const serviceTime = text(body.serviceTime);
  if (serviceTime !== undefined) out.serviceTime = serviceTime;
  const bookings = text(body.bookings);
  if (bookings !== undefined) out.bookings = bookings;
  const price = num(body.startingPrice);
  if (price !== undefined) out.startingPrice = Math.max(0, Math.round(price));
  const rating = num(body.rating);
  if (rating !== undefined) out.rating = Math.min(5, Math.max(0, rating));
  if (typeof body.active === "boolean") out.active = body.active;
  const list = problems(body.problems);
  if (list) out.problems = list;
  const picked = brands(body.brands);
  if (picked) out.brands = picked;
  const perBrand = brandPrices(body.brandPrices);
  if (perBrand) out.brandPrices = perBrand;
  const perRepair = brandProblemPrices(body.brandProblemPrices);
  if (perRepair) out.brandProblemPrices = perRepair;
  const ownRepairs = brandProblems(body.brandProblems);
  if (ownRepairs) out.brandProblems = ownRepairs;
  const packs = tiers(body.tiers);
  if (packs) out.tiers = packs;
  const headline = text(body.headline);
  if (headline !== undefined) out.headline = headline;
  const points = highlights(body.highlights);
  if (points) out.highlights = points;
  return out;
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Add a service of your own. */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name);
  if (!body || !name) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }

  const id = slugify(name);
  if (!id) {
    return NextResponse.json({ ok: false, error: "name_unusable" }, { status: 400 });
  }

  try {
    if (await serviceExists(id)) {
      return NextResponse.json({ ok: false, error: "already_exists" }, { status: 409 });
    }
    const patch = fields(body);
    const service: Omit<CatalogueService, "id"> = {
      name,
      blurb: patch.blurb ?? "",
      startingPrice: patch.startingPrice ?? 0,
      serviceTime: patch.serviceTime ?? "45–90 min",
      rating: patch.rating ?? 4.8,
      bookings: patch.bookings ?? "New",
      problems: patch.problems ?? [],
      brands: patch.brands ?? BRAND_IDS,
      brandPrices: patch.brandPrices ?? {},
      active: patch.active ?? true,
      custom: true,
      createdAt: Date.now(),
    };
    await addService(id, service);
    refresh();
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/services] add failed:", err);
    return NextResponse.json({ ok: false, error: "add_failed", detail: reason(err) }, { status: 500 });
  }
}

/** Change a service, whichever kind it is. */
export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!body || !id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const patch = fields(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  }

  try {
    if (BUILT_IN.has(id)) await editService(id, patch);
    else await updateAddedService(id, patch);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/services] edit failed:", err);
    return NextResponse.json({ ok: false, error: "edit_failed", detail: reason(err) }, { status: 500 });
  }
}

/**
 * Built-in: back to what the code says. Added: gone. The panel's Reset and
 * Delete are the same request because they mean the same thing — undo
 * everything this panel did to that service.
 */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    if (BUILT_IN.has(id)) await resetService(id);
    else await deleteAddedService(id);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/services] remove failed:", err);
    return NextResponse.json({ ok: false, error: "remove_failed", detail: reason(err) }, { status: 500 });
  }
}
