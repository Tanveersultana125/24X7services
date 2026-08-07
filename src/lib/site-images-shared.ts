/**
 * Every photograph on the marketing site that an admin can replace.
 *
 * A slot is a named position, not a file: the component asks for
 * "hero-technician" and gets whichever image is currently assigned, falling
 * back to the one shipped with the build. Client and server both read this
 * list, so it lives outside the `server-only` data layer.
 */

export type SiteImageSlot = {
  key: string;
  label: string;
  /** Where it appears, so the panel doesn't need a screenshot to be usable. */
  where: string;
  /** Shipped with the build; used until someone uploads a replacement. */
  defaultSrc: string;
  /** Shape the slot is cropped to, as a hint for whoever uploads. */
  ratio: string;
  /** Groups the admin panel into sections that match the page. */
  group: string;
};

/**
 * Each group is its own page under Admin → Images, in this order. The slug is
 * the URL; the name is what a slot's `group` field carries.
 */
export const SITE_IMAGE_GROUP_PAGES = [
  { slug: "sections", name: "Page sections", blurb: "The standalone photographs across the homepage and inner pages." },
  { slug: "most-booked", name: "Most booked", blurb: "The service cards in the “Our most booked services” strip." },
  { slug: "spotlight", name: "Spotlight", blurb: "The wide banners in “Handpicked for you”." },
  { slug: "noteworthy", name: "New & noteworthy", blurb: "The square cards in “Fresh on the menu”." },
] as const;

export const SITE_IMAGE_GROUPS = SITE_IMAGE_GROUP_PAGES.map((g) => g.name);

export function groupBySlug(slug: string) {
  return SITE_IMAGE_GROUP_PAGES.find((g) => g.slug === slug) ?? null;
}

/**
 * Stored against a slot an admin has emptied, and the default for a position
 * that ships without a photo. A slot always holds something, so "no photo
 * here" has to be a value rather than a missing row — a missing row already
 * means "use the one from the build".
 */
export const NO_IMAGE = "__none__";

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  {
    key: "hero-technician",
    label: "Hero technician",
    where: "Homepage — the large photo beside the headline",
    defaultSrc: "/work/hero-service-collage.webp",
    ratio: "Portrait, cut out on a transparent background",
    group: "Page sections",
  },
  {
    key: "expertise-service",
    label: "Refrigerator care photo",
    where: "Homepage — “Fridge trouble, sorted today”",
    defaultSrc: "/work/fridge-expertise.webp",
    ratio: "Landscape 4:3",
    group: "Page sections",
  },
  {
    key: "cooling-family",
    label: "Smart cooling photo",
    where: "Homepage — “Smart cooling solutions for modern homes”",
    defaultSrc: "/work/family-ac.png",
    ratio: "Landscape 4:3 (square on phones)",
    group: "Page sections",
  },
  {
    key: "warranty-tile",
    label: "90-day warranty tile",
    where: "Homepage — the dark tile in the trust grid",
    defaultSrc: "/work/ac-hero.png",
    ratio: "Landscape, subject on the right",
    group: "Page sections",
  },
  {
    key: "faq-technician",
    label: "FAQ technician",
    where: "Homepage FAQ — the right-hand photo rail",
    defaultSrc: "/work/ac-faq-technician.png",
    ratio: "Tall portrait",
    group: "Page sections",
  },
  {
    key: "estimate-tablet",
    label: "Estimate photo",
    where: "Quick estimate section",
    defaultSrc: "/work/ac-tech-tablet.png",
    ratio: "Landscape",
    group: "Page sections",
  },
  {
    key: "contact-promise",
    label: "Contact panel illustration",
    where: "Contact panel — the artwork beside “Let’s get it fixed”",
    defaultSrc: "/work/fridge-promise.webp",
    ratio: "Tall portrait, cut out",
    group: "Page sections",
  },
  {
    key: "promise-shield",
    label: "Promise shield",
    where: "Contact panel and the services promise card",
    defaultSrc: "/work/promise-shield-cut.png",
    ratio: "Square, cut out",
    group: "Page sections",
  },
  {
    key: "appliance-lineup",
    label: "Appliance line-up",
    where: "Services page — the appliances card",
    defaultSrc: "/work/appliance-lineup-v2.png",
    ratio: "Wide landscape, cut out",
    group: "Page sections",
  },
  // ---- Most booked carousel ----
  { key: "mostbooked-ac-service", label: "AC repair & service", where: "Homepage — Most booked, card 1", defaultSrc: "/work/ac-service.png", ratio: "Landscape 5:4", group: "Most booked" },
  { key: "mostbooked-ac-installation", label: "AC installation", where: "Homepage — Most booked, card 2", defaultSrc: "/work/ac.png", ratio: "Landscape 5:4", group: "Most booked" },
  { key: "mostbooked-refrigerator", label: "Refrigerator repair", where: "Homepage — Most booked", defaultSrc: "/work/refrigerator.png", ratio: "Landscape 5:4", group: "Most booked" },
  { key: "mostbooked-washing-machine", label: "Washing machine repair", where: "Homepage — Most booked", defaultSrc: "/work/washing-machine.png", ratio: "Landscape 5:4", group: "Most booked" },
  { key: "mostbooked-microwave", label: "Microwave repair", where: "Homepage — Most booked", defaultSrc: "/work/microwave.png", ratio: "Landscape 5:4", group: "Most booked" },
  { key: "mostbooked-ac", label: "AC service", where: "Homepage — Most booked", defaultSrc: "/work/gallery/ac-3.png", ratio: "Landscape 5:4", group: "Most booked" },

  // ---- Spotlight banners ----
  { key: "spotlight-deep-clean", label: "Foam-jet AC deep clean", where: "Homepage — Spotlight banner 1", defaultSrc: "/work/ac-service.png", ratio: "Wide banner, subject on the right", group: "Spotlight" },
  { key: "spotlight-care-plan", label: "Annual Care Plan", where: "Homepage — Spotlight banner 2", defaultSrc: "/work/gallery/fridge-1.png", ratio: "Wide banner, subject on the right", group: "Spotlight" },
  { key: "spotlight-emergency", label: "24x7 emergency repair", where: "Homepage — Spotlight banner 3", defaultSrc: "/work/gallery/washing-1.png", ratio: "Wide banner, subject on the right", group: "Spotlight" },
  { key: "spotlight-microwave", label: "Microwave & oven care", where: "Homepage — Spotlight banner 4", defaultSrc: "/work/microwave.png", ratio: "Wide banner, subject on the right", group: "Spotlight" },

  // ---- New & noteworthy ----
  { key: "noteworthy-ac-service", label: "Foam-jet AC service", where: "Homepage — Fresh on the menu", defaultSrc: "/work/ac-service.png", ratio: "Square", group: "New & noteworthy" },
  { key: "noteworthy-washer", label: "Front-load washer care", where: "Homepage — Fresh on the menu", defaultSrc: "/work/gallery/washing-1.png", ratio: "Square", group: "New & noteworthy" },
  { key: "noteworthy-fridge", label: "Smart fridge diagnosis", where: "Homepage — Fresh on the menu", defaultSrc: "/work/gallery/fridge-1.png", ratio: "Square", group: "New & noteworthy" },
  { key: "noteworthy-microwave", label: "Microwave express fix", where: "Homepage — Fresh on the menu", defaultSrc: "/work/microwave.png", ratio: "Square", group: "New & noteworthy" },
  { key: "noteworthy-installation", label: "AC installation", where: "Homepage — Fresh on the menu", defaultSrc: "/work/ac.png", ratio: "Square", group: "New & noteworthy" },
  { key: "noteworthy-gas", label: "Refrigerator gas top-up", where: "Homepage — Fresh on the menu", defaultSrc: "/work/gallery/fridge-2.png", ratio: "Square", group: "New & noteworthy" },
];

export type SiteImages = Record<string, string>;

/** The build's own images, used before anything is uploaded. */
export const DEFAULT_SITE_IMAGES: SiteImages = Object.fromEntries(
  SITE_IMAGE_SLOTS.map((s) => [s.key, s.defaultSrc]),
);
