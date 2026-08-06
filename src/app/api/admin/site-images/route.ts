import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { setSiteImage, resetSiteImage } from "@/lib/site-images";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images-shared";

/** Assign or clear the photo in a site image slot. Admin session required. */

const KEYS = new Set(SITE_IMAGE_SLOTS.map((s) => s.key));

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

/**
 * These photos appear across the marketing site, and the layout that resolves
 * them is shared — so every page is refreshed rather than guessing which ones
 * hold the slot that changed.
 */
function refreshPublicPages() {
  revalidatePath("/", "layout");
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const src = typeof body?.src === "string" ? body.src.trim() : "";

  // Our own assets or an https URL — nothing else gets rendered as site imagery.
  const validSrc = src.startsWith("/") || src.startsWith("https://");
  if (!KEYS.has(key) || !validSrc) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await setSiteImage(key, src);
    refreshPublicPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/site-images] set failed:", err);
    return NextResponse.json({ ok: false, error: "set_failed", detail: reason(err) }, { status: 500 });
  }
}

/** Puts a slot back to the image that ships with the build. */
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
    await resetSiteImage(key);
    refreshPublicPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/site-images] reset failed:", err);
    return NextResponse.json({ ok: false, error: "reset_failed", detail: reason(err) }, { status: 500 });
  }
}
