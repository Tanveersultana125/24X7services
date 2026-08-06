import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { addGalleryPhoto, deleteGalleryPhoto } from "@/lib/gallery";
import { GALLERY_CATEGORIES } from "@/lib/gallery-shared";

/** Add or remove a work photo. Admin session required. */

const MAX_LABEL = 80;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

/** The page that renders the gallery. */
function refreshPublicPages() {
  revalidatePath("/process");
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const src = typeof body?.src === "string" ? body.src.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, MAX_LABEL) : "";
  const category = typeof body?.category === "string" ? body.category : "";

  // Only our own /public assets or an https URL — a stray "javascript:" or a
  // data URI has no business being rendered as a site photo.
  const validSrc = src.startsWith("/") || src.startsWith("https://");
  if (!validSrc || !(GALLERY_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const { id } = await addGalleryPhoto({ src, label: label || "Untitled", category });
    refreshPublicPages();
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/gallery] add failed:", err);
    return NextResponse.json({ ok: false, error: "add_failed", detail: reason(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await deleteGalleryPhoto(id);
    refreshPublicPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/gallery] delete failed:", err);
    return NextResponse.json({ ok: false, error: "delete_failed", detail: reason(err) }, { status: 500 });
  }
}
