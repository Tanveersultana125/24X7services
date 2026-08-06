import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_SITE_IMAGES, type SiteImages } from "@/lib/site-images-shared";

/**
 * Which photograph is currently assigned to each slot.
 *
 * Overrides live in one Firestore collection keyed by slot; anything not
 * overridden falls back to the image shipped with the build, so the site
 * renders correctly on a fresh database and if Firestore is unreachable.
 */

const SITE_IMAGES = "siteImages";

/**
 * The root layout reads this on every request, so a short cache keeps that
 * from becoming a Firestore round-trip per page view. Writes clear it, and
 * revalidatePath refreshes the pages themselves.
 */
const TTL_MS = 60_000;

/**
 * On globalThis, not in a module variable: the layout and the admin route are
 * separate module instances, so a write clearing its own copy would leave the
 * layout serving the old photo until the TTL ran out.
 */
const store = globalThis as typeof globalThis & {
  __24x7SiteImages?: { at: number; value: SiteImages } | null;
};

export async function getSiteImages(): Promise<SiteImages> {
  const cache = store.__24x7SiteImages;
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  try {
    const snap = await getAdminDb().collection(SITE_IMAGES).get();
    const overrides: SiteImages = {};
    for (const doc of snap.docs) {
      const src = doc.data().src;
      if (typeof src === "string" && src) overrides[doc.id] = src;
    }
    const value = { ...DEFAULT_SITE_IMAGES, ...overrides };
    store.__24x7SiteImages = { at: Date.now(), value };
    return value;
  } catch {
    // A database that isn't reachable shouldn't take the whole site's imagery
    // with it — the build's own photos are a perfectly good answer.
    return DEFAULT_SITE_IMAGES;
  }
}

export async function setSiteImage(key: string, src: string): Promise<void> {
  await getAdminDb().collection(SITE_IMAGES).doc(key).set({
    src,
    updatedAt: FieldValue.serverTimestamp(),
  });
  store.__24x7SiteImages = null;
}

/** Puts the slot back to the image that ships with the build. */
export async function resetSiteImage(key: string): Promise<void> {
  await getAdminDb().collection(SITE_IMAGES).doc(key).delete();
  store.__24x7SiteImages = null;
}
