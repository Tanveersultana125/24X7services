import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { setSectionOverride, clearSectionOverride } from "@/lib/section-overrides";
import {
  OVERRIDE_NUMBER_FIELDS,
  OVERRIDE_TEXT_FIELDS,
  type SectionOverride,
} from "@/lib/section-overrides-shared";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images-shared";

/**
 * Rewrite or hide one of the built-in strip cards. Admin session required.
 *
 * Keyed by the card's image slot, so a card is one thing to the panel whether
 * you are changing its picture or its words.
 */

const KEYS = new Set(SITE_IMAGE_SLOTS.map((s) => s.key));
const MAX_TEXT = 80;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  if (!KEYS.has(key)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const fields: SectionOverride = {};
  for (const name of OVERRIDE_TEXT_FIELDS) {
    const raw = body?.[name];
    if (typeof raw === "string") fields[name] = raw.trim().slice(0, MAX_TEXT);
  }
  for (const name of OVERRIDE_NUMBER_FIELDS) {
    const raw = body?.[name];
    if (typeof raw === "number" && Number.isFinite(raw)) fields[name] = raw;
  }
  if (typeof body?.hidden === "boolean") fields.hidden = body.hidden;

  // A link that leaves the site has no business being set from here.
  if (fields.href && !fields.href.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "invalid_href" }, { status: 400 });
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, error: "nothing_to_change" }, { status: 400 });
  }

  try {
    await setSectionOverride(key, fields);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/section-overrides] set failed:", err);
    return NextResponse.json({ ok: false, error: "set_failed", detail: reason(err) }, { status: 500 });
  }
}

/** Restores the card to what the code says — words, link and visibility. */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  if (!KEYS.has(key)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await clearSectionOverride(key);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/section-overrides] clear failed:", err);
    return NextResponse.json({ ok: false, error: "clear_failed", detail: reason(err) }, { status: 500 });
  }
}
