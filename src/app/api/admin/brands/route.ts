import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import {
  addBrand,
  brandExists,
  deleteAddedBrand,
  editBrand,
  resetBrand,
  updateAddedBrand,
} from "@/lib/brands";
import { getCatalogue, editService, updateAddedService } from "@/lib/catalogue";
import { DEFAULT_SERVICES, brandsFor } from "@/lib/catalogue-shared";
import {
  BUILT_IN_BRAND_IDS,
  DEFAULT_BRAND_ACCENT,
  brandSlug,
  type AdminBrand,
  type BrandEdit,
} from "@/lib/brands-shared";

/**
 * The makes we service: change one that ships with the build, add a company of
 * your own, or take an added one away. Admin session required.
 *
 * A built-in and an added make are edited through the same PATCH — which
 * collection the change lands in is decided here, not by the caller.
 */

const MAX_TEXT = 80;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : undefined;
}

/** A house colour is only usable if it is a colour — anything else is dropped. */
function hex(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const short = /^#[0-9a-fA-F]{3}$/.test(raw);
  const long = /^#[0-9a-fA-F]{6}$/.test(raw);
  if (!short && !long) return undefined;
  if (!short) return raw.toUpperCase();
  // #abc and #aabbcc are the same colour; storing one form keeps the pickers
  // (which only speak the long one) from showing black for a valid value.
  const [, r, g, b] = raw;
  return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
}

function fields(body: Record<string, unknown>): BrandEdit {
  const out: BrandEdit = {};
  const name = text(body.name);
  if (name) out.name = name;
  const tagline = text(body.tagline);
  if (tagline !== undefined) out.tagline = tagline;
  const accent = hex(body.accent);
  if (accent) out.accent = accent;
  if (typeof body.active === "boolean") out.active = body.active;
  return out;
}

function refresh() {
  revalidatePath("/", "layout");
}

const BUILT_IN_SERVICES = new Set(DEFAULT_SERVICES.map((s) => s.id));

/**
 * Tick a newly added make on every service.
 *
 * A company that services nothing appears nowhere — no page, no booking step,
 * no chip — so adding one and seeing no change is the likelier surprise than
 * having to untick the two services it doesn't cover.
 */
async function coverEverything(id: string): Promise<void> {
  const services = await getCatalogue();
  await Promise.all(
    services.map((s) => {
      const brands = brandsFor(s);
      if (brands.includes(id)) return Promise.resolve();
      const patch = { brands: [...brands, id] };
      return BUILT_IN_SERVICES.has(s.id) ? editService(s.id, patch) : updateAddedService(s.id, patch);
    }),
  );
}

/** Add a company of your own. */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name);
  if (!body || !name) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }

  const id = brandSlug(name);
  if (!id) {
    return NextResponse.json({ ok: false, error: "name_unusable" }, { status: 400 });
  }
  // "other" is the booking form's own sentinel for a make we don't list — a
  // company called that would collide with it.
  if (id === "other") {
    return NextResponse.json({ ok: false, error: "name_reserved" }, { status: 400 });
  }

  try {
    if (await brandExists(id)) {
      return NextResponse.json({ ok: false, error: "already_exists" }, { status: 409 });
    }
    const patch = fields(body);
    const brand: Omit<AdminBrand, "id"> = {
      name,
      tagline: patch.tagline ?? `Repair & servicing for ${name} appliances`,
      accent: patch.accent ?? DEFAULT_BRAND_ACCENT,
      active: patch.active ?? true,
      custom: true,
      createdAt: Date.now(),
    };
    await addBrand(id, brand);
    await coverEverything(id);
    refresh();
    return NextResponse.json({ ok: true, id, brand: { id, ...brand } });
  } catch (err) {
    console.error("[admin/brands] add failed:", err);
    return NextResponse.json({ ok: false, error: "add_failed", detail: reason(err) }, { status: 500 });
  }
}

/** Change a make, whichever kind it is. */
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
    if (BUILT_IN_BRAND_IDS.has(id)) await editBrand(id, patch);
    else await updateAddedBrand(id, patch);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/brands] edit failed:", err);
    return NextResponse.json({ ok: false, error: "edit_failed", detail: reason(err) }, { status: 500 });
  }
}

/**
 * Built-in: back to what the code says. Added: gone. The panel's Reset and
 * Delete are the same request because they mean the same thing — undo
 * everything this panel did to that make.
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
    if (BUILT_IN_BRAND_IDS.has(id)) await resetBrand(id);
    else await deleteAddedBrand(id);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/brands] remove failed:", err);
    return NextResponse.json({ ok: false, error: "remove_failed", detail: reason(err) }, { status: 500 });
  }
}
