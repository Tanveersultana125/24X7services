import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { addSectionItem, deleteSectionItem } from "@/lib/section-items";
import { SECTION_FIELDS, type SectionId } from "@/lib/section-items-shared";

/** Add or remove a card in one of the homepage strips. Admin session required. */

const SECTIONS = new Set(Object.keys(SECTION_FIELDS));
const MAX_TEXT = 80;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

const text = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_TEXT) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const section = String(body?.section ?? "");
  const src = text(body?.src);
  const title = text(body?.title);
  const href = text(body?.href) || "/book";

  // Our own assets or an https URL, and a link that stays on this site.
  const validSrc = src.startsWith("/") || src.startsWith("https://");
  const validHref = href.startsWith("/");
  if (!SECTIONS.has(section) || !validSrc || !title || !validHref) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const { id } = await addSectionItem({
      section: section as SectionId,
      src,
      title,
      sub: text(body?.sub),
      cta: text(body?.cta) || "Book now",
      price: num(body?.price),
      rating: num(body?.rating),
      meta: text(body?.meta),
      badge: text(body?.badge),
      href,
      tint: /^#[0-9a-fA-F]{6}$/.test(String(body?.tint)) ? String(body.tint) : "#16306e",
    });
    // These strips are on the homepage, and the layout resolves them for
    // every page that renders one.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/section-items] add failed:", err);
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
    await deleteSectionItem(id);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/section-items] delete failed:", err);
    return NextResponse.json({ ok: false, error: "delete_failed", detail: reason(err) }, { status: 500 });
  }
}
