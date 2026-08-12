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

/**
 * The photographs the site ships with.
 *
 * They are the gallery until someone changes it, and they are seeded into the
 * database on first read so the panel lists exactly what the Process page
 * shows. Without that the panel said "No photos yet" beside a page displaying
 * nine of them.
 */
export const DEFAULT_GALLERY: { src: string; label: string; category: string }[] = [
  { src: "/work/gallery/ac-1.png", label: "AC service", category: "AC" },
  { src: "/work/gallery/fridge-1.png", label: "Refrigerator repair", category: "Refrigerator" },
  { src: "/work/gallery/washing-1.png", label: "Washing machine repair", category: "Washing Machine" },
  { src: "/work/gallery/microwave-1.png", label: "Microwave repair", category: "Microwave & Oven" },
  { src: "/work/gallery/ac-3.png", label: "AC installation", category: "AC" },
  { src: "/work/gallery/washing-2.png", label: "Front-load service", category: "Washing Machine" },
  { src: "/work/gallery/microwave-2.png", label: "Microwave diagnosis", category: "Microwave & Oven" },
  { src: "/work/gallery/fridge-2.png", label: "Cooling repair", category: "Refrigerator" },
  { src: "/work/gallery/ac-2.png", label: "Split-AC deep clean", category: "AC" },
];
