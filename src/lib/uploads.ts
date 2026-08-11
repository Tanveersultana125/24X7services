import "server-only";
import { createHash } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

/**
 * Where an uploaded image goes.
 *
 * Three places are tried, in this order:
 *
 *  1. Cloudinary, if its three variables are set. Nothing has to be switched
 *     on in another console for it to work, and it serves the images itself.
 *  2. The project's own Firebase Storage bucket — Firebase is already the
 *     database and the auth, so this adds no third party.
 *  3. The server's disk, in development only. A deployed disk is wiped on
 *     every deploy and usually read-only, so writing there would report a
 *     saved photograph that 404s for every visitor.
 *
 * The Cloudinary upload is signed here, on the server. The secret never
 * reaches the browser, and the route that calls this already requires an admin
 * session — an unsigned browser preset would let anyone with the page source
 * upload into the account.
 */

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const CLOUDINARY = {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET,
};

function cloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY.cloud && CLOUDINARY.key && CLOUDINARY.secret);
}

/** True when an upload has somewhere to go that outlives a deploy. */
export function storageConfigured(): boolean {
  return cloudinaryConfigured() || Boolean(BUCKET);
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
  /** Where the bytes ended up — the panel says so when it isn't permanent. */
  stored: "cloudinary" | "bucket" | "disk";
};

export async function uploadImage(input: {
  data: Buffer;
  filename: string;
  contentType: string;
  /** Folder — "site-images" or "gallery". */
  folder: string;
}): Promise<UploadResult> {
  const path = `${input.folder}/${safeName(input.filename)}`;

  if (cloudinaryConfigured()) return uploadToCloudinary(input, path);

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

      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Firebase Storage isn't enabled for ${BUCKET}, and Cloudinary isn't configured either. Turn Storage on in the Firebase console, or set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.`,
        );
      }
      console.warn("[uploads] no storage bucket — writing to public/uploads instead");
    }
  }

  return writeToDisk(path, input.data);
}

/**
 * Cloudinary's signature is the sha1 of the parameters being sent, sorted by
 * name and joined as a query string, with the API secret appended. Only the
 * parameters below are signed, so only these may be sent.
 */
function sign(params: Record<string, string>): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(canonical + CLOUDINARY.secret).digest("hex");
}

async function uploadToCloudinary(
  input: { data: Buffer; filename: string; contentType: string; folder: string },
  path: string,
): Promise<UploadResult> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  // Its own id, without the extension — Cloudinary adds one back on delivery.
  const publicId = path.replace(/\.[^.]+$/, "");
  const signed = { public_id: publicId, timestamp };

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(input.data)], { type: input.contentType }), input.filename);
  form.append("api_key", CLOUDINARY.key!);
  form.append("public_id", signed.public_id);
  form.append("timestamp", signed.timestamp);
  form.append("signature", sign(signed));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null;

  if (!res.ok || !data?.secure_url) {
    // Cloudinary's own words, which name the wrong value — "Invalid API key",
    // "Unknown API key", "Invalid Signature" all mean different fixes.
    const said = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(
      `Cloudinary rejected the upload: ${said}. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET against Cloudinary → Settings → API Keys.`,
    );
  }

  return { url: data.secure_url, stored: "cloudinary" };
}

/**
 * Development only, and only until real storage is configured. These files are
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

/**
 * Whether an upload actually has somewhere to go, checked rather than assumed.
 *
 * A Firebase bucket name in the environment doesn't mean Storage was ever
 * switched on — this project has had one set the whole time while every upload
 * failed. So the bucket is asked whether it exists, and the answer is cached
 * for a few minutes because it changes about once in a project's life.
 */
export type StorageStatus = { ok: boolean; where: string; problem?: string };

const STATUS_TTL_MS = 5 * 60 * 1000;
const statusCache = globalThis as typeof globalThis & {
  __24x7StorageStatus?: { at: number; value: StorageStatus };
};

export async function describeStorage(): Promise<StorageStatus> {
  const cached = statusCache.__24x7StorageStatus;
  if (cached && Date.now() - cached.at < STATUS_TTL_MS) return cached.value;

  const value = await probeStorage();
  statusCache.__24x7StorageStatus = { at: Date.now(), value };
  return value;
}

async function probeStorage(): Promise<StorageStatus> {
  if (cloudinaryConfigured()) {
    return { ok: true, where: `Cloudinary (${CLOUDINARY.cloud})` };
  }

  if (BUCKET) {
    try {
      const [exists] = await getStorage(getAdminApp()).bucket(BUCKET).exists();
      if (exists) return { ok: true, where: `Firebase Storage (${BUCKET})` };
      return {
        ok: false,
        where: "nowhere",
        problem: `Firebase Storage has never been switched on for ${BUCKET}, so the bucket doesn't exist.`,
      };
    } catch (err) {
      return {
        ok: false,
        where: "nowhere",
        problem: `Couldn't reach Firebase Storage: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return { ok: false, where: "nowhere", problem: "No storage is configured." };
}
