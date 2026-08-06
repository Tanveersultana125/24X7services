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
};

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  {
    key: "hero-technician",
    label: "Hero technician",
    where: "Homepage — the large photo beside the headline",
    defaultSrc: "/work/technician.png",
    ratio: "Portrait, cut out on a transparent background",
  },
  {
    key: "expertise-service",
    label: "Cooling solutions photo",
    where: "Homepage — “Cooling solutions, done right”",
    defaultSrc: "/work/ac-service.png",
    ratio: "Landscape 4:3",
  },
  {
    key: "cooling-family",
    label: "Smart cooling photo",
    where: "Homepage — “Smart cooling solutions for modern homes”",
    defaultSrc: "/work/family-ac.png",
    ratio: "Landscape 4:3 (square on phones)",
  },
  {
    key: "warranty-tile",
    label: "90-day warranty tile",
    where: "Homepage — the dark tile in the trust grid",
    defaultSrc: "/work/ac-hero.png",
    ratio: "Landscape, subject on the right",
  },
  {
    key: "faq-technician",
    label: "FAQ technician",
    where: "Homepage FAQ — the right-hand photo rail",
    defaultSrc: "/work/ac-faq-technician.png",
    ratio: "Tall portrait",
  },
  {
    key: "estimate-tablet",
    label: "Estimate photo",
    where: "Quick estimate section",
    defaultSrc: "/work/ac-tech-tablet.png",
    ratio: "Landscape",
  },
  {
    key: "promise-shield",
    label: "Promise shield",
    where: "Contact panel and the services promise card",
    defaultSrc: "/work/promise-shield-cut.png",
    ratio: "Square, cut out",
  },
  {
    key: "appliance-lineup",
    label: "Appliance line-up",
    where: "Services page — the appliances card",
    defaultSrc: "/work/appliance-lineup-v2.png",
    ratio: "Wide landscape, cut out",
  },
];

export type SiteImages = Record<string, string>;

/** The build's own images, used before anything is uploaded. */
export const DEFAULT_SITE_IMAGES: SiteImages = Object.fromEntries(
  SITE_IMAGE_SLOTS.map((s) => [s.key, s.defaultSrc]),
);
