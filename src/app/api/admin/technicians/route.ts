import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import {
  addTechnician,
  deleteTechnician,
  normalisePhone,
  technicianExists,
  technicianSlug,
  updateTechnician,
} from "@/lib/technicians";

/** The people on the books: take one on, change one, take one off. Admin only. */

const MAX_TEXT = 60;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : undefined;
}

/** Four to six digits. Long enough not to be guessed on the doorstep. */
function pin(value: unknown): string | undefined {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^\d{4,6}$/.test(raw) ? raw : undefined;
}

function skills(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, 12)
    .map((s) => text(s))
    .filter((s): s is string => Boolean(s));
}

function refresh() {
  revalidatePath("/admin", "layout");
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name);
  const phone = normalisePhone(text(body?.phone) ?? "");
  const code = pin(body?.pin);

  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  if (phone.length !== 10) {
    return NextResponse.json({ ok: false, error: "phone_invalid" }, { status: 400 });
  }
  if (!code) return NextResponse.json({ ok: false, error: "pin_invalid" }, { status: 400 });

  const id = technicianSlug(name);
  if (!id) return NextResponse.json({ ok: false, error: "name_unusable" }, { status: 400 });

  try {
    if (await technicianExists(id)) {
      return NextResponse.json({ ok: false, error: "already_exists" }, { status: 409 });
    }
    await addTechnician({
      name,
      phone,
      pin: code,
      city: text(body?.city) ?? "",
      skills: skills(body?.skills) ?? [],
    });
    refresh();
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/technicians] add failed:", err);
    return NextResponse.json({ ok: false, error: "add_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });

  // A blank PIN field means "leave it alone"; a filled one has to be a real PIN.
  const rawPin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (rawPin && !pin(rawPin)) {
    return NextResponse.json({ ok: false, error: "pin_invalid" }, { status: 400 });
  }

  const phone = body?.phone === undefined ? undefined : normalisePhone(text(body.phone) ?? "");
  if (phone !== undefined && phone.length !== 10) {
    return NextResponse.json({ ok: false, error: "phone_invalid" }, { status: 400 });
  }

  try {
    await updateTechnician(id, {
      name: text(body?.name),
      phone,
      city: text(body?.city),
      skills: skills(body?.skills),
      active: typeof body?.active === "boolean" ? body.active : undefined,
      ...(rawPin ? { pin: rawPin } : {}),
    });
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/technicians] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });

  try {
    await deleteTechnician(id);
    refresh();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/technicians] remove failed:", err);
    return NextResponse.json({ ok: false, error: "remove_failed", detail: reason(err) }, { status: 500 });
  }
}
