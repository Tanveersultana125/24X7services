/**
 * Cards an admin adds to the homepage strips, on top of the ones that ship
 * with the build.
 *
 * A slot replaces the photo in a position that already exists; this adds a
 * position. Each section needs different words around its picture, so the
 * fields are declared here and the admin form is built from them — one place
 * to change when a card gains a field.
 */

export type SectionId = "spotlight" | "most-booked" | "noteworthy";

export type SectionItem = {
  id: string;
  section: SectionId;
  src: string;
  title: string;
  /** Spotlight's line under the title; empty for the others. */
  sub: string;
  /** Spotlight's button label. */
  cta: string;
  /** Most booked: "From ₹499" is built from this. */
  price: number;
  /** Most booked: "4.9" etc. */
  rating: number;
  /** Most booked: "1.2M+ booked". Noteworthy: "In 60 mins". */
  meta: string;
  /** Noteworthy's corner label — "New". */
  badge: string;
  href: string;
  /** Spotlight's banner tint. */
  tint: string;
  createdAt: number;
};

export type SectionField = {
  name: keyof SectionItem;
  label: string;
  type: "text" | "number" | "colour";
  placeholder?: string;
  required?: boolean;
};

/** What the admin form asks for, per section. */
export const SECTION_FIELDS: Record<SectionId, SectionField[]> = {
  spotlight: [
    { name: "title", label: "Title", type: "text", placeholder: "Foam-jet AC deep clean", required: true },
    { name: "sub", label: "Subtitle", type: "text", placeholder: "Cooling like new — from ₹599" },
    { name: "cta", label: "Button label", type: "text", placeholder: "Book now" },
    { name: "href", label: "Link", type: "text", placeholder: "/book?appliance=ac", required: true },
    { name: "tint", label: "Banner tint", type: "colour" },
  ],
  "most-booked": [
    { name: "title", label: "Title", type: "text", placeholder: "AC repair & service", required: true },
    { name: "price", label: "From price (₹)", type: "number", placeholder: "299" },
    { name: "rating", label: "Rating", type: "number", placeholder: "4.7" },
    { name: "meta", label: "Meta", type: "text", placeholder: "1.4M+ booked" },
    { name: "href", label: "Link", type: "text", placeholder: "/book?appliance=ac", required: true },
  ],
  noteworthy: [
    { name: "title", label: "Title", type: "text", placeholder: "Foam-jet AC service", required: true },
    { name: "badge", label: "Badge", type: "text", placeholder: "New" },
    { name: "meta", label: "Time", type: "text", placeholder: "In 60 mins" },
    { name: "href", label: "Link", type: "text", placeholder: "/book", required: true },
  ],
};

/** Tints the spotlight banners are drawn from, so a new one stays on-palette. */
export const SPOTLIGHT_TINTS = ["#16306e", "#0b4d33", "#7a1620", "#6b3a12", "#3b2a6b"] as const;

/** Which admin images page belongs to which section. */
export const SECTION_BY_SLUG: Record<string, SectionId> = {
  spotlight: "spotlight",
  "most-booked": "most-booked",
  noteworthy: "noteworthy",
};
