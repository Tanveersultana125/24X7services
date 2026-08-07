import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { addMedia, deleteMedia } from "@/lib/media";

/**
 * The admin's own image shelf. Adding records an already-uploaded URL;
 * deleting forgets it. Nothing here is on the public site by itself, so no
 * page needs revalidating.
 */

const MAX_NAME = 80;

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME) : "";

  if (!(url.startsWith("/") || url.startsWith("https://"))) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const { id } = await addMedia({ url, name: name || "Untitled" });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[admin/media] add failed:", err);
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
    await deleteMedia(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/media] delete failed:", err);
    return NextResponse.json({ ok: false, error: "delete_failed", detail: reason(err) }, { status: 500 });
  }
}
