import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import {
  addServiceIndexRow,
  deleteServiceIndexRow,
  editServiceIndex,
  isAddedServiceIndexRow,
  resetServiceIndex,
  serviceIndexIds,
  updateServiceIndexRow,
} from "@/lib/service-index";
import {
  BUILT_IN_SERVICE_IDS,
  uniqueServiceIndexId,
  type ServiceIndexAddition,
  type ServiceIndexEdit,
} from "@/lib/service-index-shared";

/**
 * The rows under "Eight services. One standard." on /services.
 *
 * A shipped row is edited or put back; a row added here is edited or deleted.
 * Which of the two an id is decides what PATCH writes and what DELETE means,
 * so the caller never has to say. Admin session required throughout.
 */

const MAX_TEXT = 200;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : undefined;
}

function tags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, 6)
    .map((t) => text(t))
    .filter((t): t is string => Boolean(t));
}

/** Our own assets or an https URL — nothing else is rendered as site imagery. */
function imageOf(value: unknown): { ok: true; value?: string } | { ok: false } {
  const image = text(value);
  if (image === undefined) return { ok: true };
  if (image && !(image.startsWith("/") || image.startsWith("https://"))) return { ok: false };
  return { ok: true, value: image };
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!body || !id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const added = BUILT_IN_SERVICE_IDS.has(id) ? false : await isAddedServiceIndexRow(id);
  if (!BUILT_IN_SERVICE_IDS.has(id) && !added) {
    return NextResponse.json({ ok: false, error: "unknown_service" }, { status: 404 });
  }

  const fields: ServiceIndexEdit & Partial<ServiceIndexAddition> = {};
  for (const key of ["title", "desc", "price", "eta"] as const) {
    const value = text(body[key]);
    if (value !== undefined) fields[key] = value;
  }
  const parsedTags = tags(body.tags);
  if (parsedTags) fields.tags = parsedTags;

  const image = imageOf(body.image);
  if (!image.ok) return NextResponse.json({ ok: false, error: "invalid_image" }, { status: 400 });
  if (image.value !== undefined) fields.image = image.value;

  if (typeof body.hidden === "boolean") fields.hidden = body.hidden;

  // What an added row books is its own — a shipped row's is design, in the code.
  if (added) {
    const appliance = text(body.appliance);
    if (appliance !== undefined) fields.appliance = appliance;
    const kind = text(body.kind);
    if (kind === "repair" || kind === "care") fields.kind = kind;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  }

  try {
    if (added) await updateServiceIndexRow(id, fields);
    else await editServiceIndex(id, fields);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index] save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = text(body?.title);
  if (!title) {
    return NextResponse.json({ ok: false, error: "title_required" }, { status: 400 });
  }

  const image = imageOf(body?.image);
  if (!image.ok) return NextResponse.json({ ok: false, error: "invalid_image" }, { status: 400 });

  const kind = text(body?.kind) === "repair" ? "repair" : "care";
  const appliance = text(body?.appliance);

  const row: ServiceIndexAddition = {
    id: "",
    title,
    kind,
    desc: text(body?.desc) ?? "",
    price: text(body?.price) ?? "",
    eta: text(body?.eta) ?? "",
    tags: tags(body?.tags) ?? [],
    createdAt: Date.now(),
  };
  if (appliance) row.appliance = appliance;
  if (image.value) {
    row.image = image.value;
    // Each shot frames its subject differently; a little off the top is the
    // safest starting crop, and the photo can be swapped without touching it.
    row.imagePos = text(body?.imagePos) ?? "center 25%";
  }

  try {
    const id = uniqueServiceIndexId(title, await serviceIndexIds());
    await addServiceIndexRow(id, { ...row, id });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/service-index] add failed:", err);
    return NextResponse.json({ ok: false, error: "add_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = text(body?.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const added = BUILT_IN_SERVICE_IDS.has(id) ? false : await isAddedServiceIndexRow(id);
  if (!BUILT_IN_SERVICE_IDS.has(id) && !added) {
    return NextResponse.json({ ok: false, error: "unknown_service" }, { status: 404 });
  }

  try {
    // A shipped row goes back to the code; an added one leaves for good.
    if (added) await deleteServiceIndexRow(id);
    else await resetServiceIndex(id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index] remove failed:", err);
    return NextResponse.json({ ok: false, error: "remove_failed", detail: reason(err) }, { status: 500 });
  }
}
