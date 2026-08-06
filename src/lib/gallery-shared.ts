/**
 * The parts of the gallery both sides need. Kept out of `gallery.ts` because
 * that one is `server-only` — the admin panel is a Client Component and would
 * drag firebase-admin into the browser bundle just to read a list of
 * categories.
 */

export type GalleryPhoto = {
  id: string;
  src: string;
  label: string;
  category: string;
  createdAt: number;
};

export const GALLERY_CATEGORIES = [
  "AC",
  "Refrigerator",
  "Washing Machine",
  "Microwave & Oven",
] as const;
