import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { editServiceIndexCopy, resetServiceIndexCopy } from "@/lib/service-index";
import {
  SERVICE_INDEX_COPY_FIELDS,
  type ServiceIndexCopy,
} from "@/lib/service-index-shared";

/**
 * The words around the service index — the kicker, the two headline lines and
 * the paragraph beside them. The headline counts the services out loud, so it
 * has to move when a row is added or hidden. Admin session required.
 */

const MAX_TEXT = 400;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const fields: Partial<ServiceIndexCopy> = {};
  for (const key of SERVICE_INDEX_COPY_FIELDS) {
    const value = body?.[key];
    if (typeof value === "string") fields[key] = value.trim().slice(0, MAX_TEXT);
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  }

  try {
    await editServiceIndexCopy(fields);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index/copy] save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  try {
    await resetServiceIndexCopy();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/service-index/copy] reset failed:", err);
    return NextResponse.json({ ok: false, error: "reset_failed", detail: reason(err) }, { status: 500 });
  }
}
