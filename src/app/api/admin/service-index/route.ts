import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { editServiceIndex, resetServiceIndex } from "@/lib/service-index";
import { SERVICE_INDEX_DEFAULTS, type ServiceIndexEdit } from "@/lib/service-index-shared";

/** Change a row of the /services index, or put it back. Admin session required. */

const IDS = new Set(SERVICE_INDEX_DEFAULTS.map((s) => s.id));
const MAX_TEXT = 200;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : undefined;
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!body || !id || !IDS.has(id)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const fields: ServiceIndexEdit = {};
  for (const key of ["title", "desc", "price", "eta"] as const) {
    const value = text(body[key]);
    if (value !== undefined) fields[key] = value;
  }
  if (Array.isArray(body.tags)) {
    fields.tags = body.tags
      .slice(0, 6)
      .map((t) => text(t))
      .filter((t): t is string => Boolean(t));
  }
  // Our own assets or an https URL — nothing else is rendered as site imagery.
  const image = text(body.image);
  if (image !== undefined) {
    if (image && !(image.startsWith("/") || image.startsWith("https://"))) {
      return NextResponse.json({ ok: false, error: "invalid_image" }, { status: 400 });
    }
    fields.image = image;
  }
  if (typeof body.hidden === "boolean") fields.hidden = body.hidden;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  }

  try {
    await editServiceIndex(id, fields);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index] save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!id || !IDS.has(id)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await resetServiceIndex(id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index] reset failed:", err);
    return NextResponse.json({ ok: false, error: "reset_failed", detail: reason(err) }, { status: 500 });
  }
}
