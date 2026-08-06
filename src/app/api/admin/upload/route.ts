import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { uploadImage, storageConfigured } from "@/lib/uploads";

/**
 * Take an image from the admin panel and store it in the project's own bucket,
 * returning the URL to save against a slot or a gallery photo.
 *
 * The file goes browser → this route → Firebase Storage. Nothing is trusted
 * from the client beyond the bytes: the type and size are checked here, and
 * the folder is chosen from a fixed list.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const FOLDERS = new Set(["site-images", "gallery"]);
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (!storageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_not_configured" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "site-images");

  if (!(file instanceof File) || !FOLDERS.has(folder)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  if (!TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "unsupported_type", detail: file.type }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  try {
    const { url, stored } = await uploadImage({
      data: Buffer.from(await file.arrayBuffer()),
      filename: file.name || "image",
      contentType: file.type,
      folder,
    });
    return NextResponse.json({ ok: true, url, stored });
  } catch (err) {
    console.error("[admin/upload] failed:", err);
    return NextResponse.json({ ok: false, error: "upload_failed", detail: reason(err) }, { status: 500 });
  }
}
