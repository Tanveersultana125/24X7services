import "server-only";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

/**
 * Image uploads, stored in the project's own Firebase Storage bucket.
 *
 * Firebase is already the database and the auth; using its bucket keeps
 * uploads on infrastructure this project already owns, rather than depending
 * on a third-party account whose credentials have to be kept in step.
 */

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export function storageConfigured(): boolean {
  return Boolean(BUCKET);
}

/** Keeps a recognisable name while making collisions impossible. */
function safeName(original: string): string {
  const cleaned = original
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const ext = /\.([a-z0-9]+)$/i.exec(original)?.[1]?.toLowerCase() ?? "jpg";
  return `${cleaned || "image"}-${Date.now().toString(36)}.${ext}`;
}

export type UploadResult = {
  url: string;
  /** Where the bytes ended up — the panel says so when it isn't the bucket. */
  stored: "bucket" | "disk";
};

export async function uploadImage(input: {
  data: Buffer;
  filename: string;
  contentType: string;
  /** Folder — "site-images" or "gallery". */
  folder: string;
}): Promise<UploadResult> {
  const path = `${input.folder}/${safeName(input.filename)}`;

  if (BUCKET) {
    try {
      const file = getStorage(getAdminApp()).bucket(BUCKET).file(path);
      await file.save(input.data, {
        contentType: input.contentType,
        // These are marketing photographs on a public site, and they never
        // change once written — the name carries a timestamp.
        metadata: { cacheControl: "public, max-age=31536000, immutable" },
      });
      await file.makePublic();
      return { url: `https://storage.googleapis.com/${BUCKET}/${encodeURI(path)}`, stored: "bucket" };
    } catch (err) {
      // A project with Storage still switched off has no bucket at all.
      if (!/bucket does not exist|notFound|404/i.test(String(err))) throw err;

      // On a deployed server the disk is not the site: it is wiped on every
      // deploy and, on most hosts, read-only. Falling back there would report
      // a saved photograph that 404s for every visitor — so say what's wrong
      // instead of appearing to succeed.
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Firebase Storage isn't enabled for ${BUCKET}. Turn Storage on in the Firebase console — a deployed server has nowhere else to keep an upload.`,
        );
      }
      console.warn("[uploads] no storage bucket — writing to public/uploads instead");
    }
  }

  return writeToDisk(path, input.data);
}

/**
 * Development only, and only until Storage is switched on. These files are
 * committed rather than ignored: the URL stored against a slot points at
 * /uploads/…, so a deployed build has to carry them or the position 404s.
 */
async function writeToDisk(path: string, data: Buffer): Promise<UploadResult> {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");

  const target = join(process.cwd(), "public", "uploads", path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);

  return { url: `/uploads/${path}`, stored: "disk" };
}
