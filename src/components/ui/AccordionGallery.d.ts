/**
 * Types for the vendored React Bits `AccordionGallery.jsx`.
 *
 * The component ships as JavaScript, so TypeScript would otherwise infer its
 * prop types from the sample data it falls back to — which made `link`, one of
 * the optional fields, look required. Declaring the contract here keeps the
 * component file identical to upstream and still typechecks call sites.
 */

export type AccordionGalleryItem = {
  image: string;
  label?: string;
  link?: string;
  alt?: string;
};

export type AccordionGalleryProps = {
  items?: AccordionGalleryItem[];
  /** Panel expanded on load, so the gallery never looks dead. */
  defaultIndex?: number;
  /** Caption accent bar and focus ring. */
  accentColor?: string;
  /** Bottom legibility gradient and the dimming of collapsed panels. */
  overlayColor?: string;
  textColor?: string;
  /** Height of the row in pixels — the width of the column when vertical. */
  height?: number;
  gap?: number;
  radius?: number;
  /** Fraction of the row the expanded panel takes, clamped to 0.2 – 0.9. */
  expandRatio?: number;
  orientation?: "horizontal" | "vertical";
  duration?: number;
  /** GSAP easing used for every transition. */
  ease?: string;
  /** Strength of the internal image drift as panels resize; 0 disables it. */
  parallax?: number;
  /** Degrees of 3D rotation on collapsed panels, easing to flat on the open one. */
  tilt?: number;
  /** Delay between the caption bar and text reveal, in seconds. */
  stagger?: number;
  /** How a panel expands on pointer devices; focus and tap always expand too. */
  trigger?: "hover" | "click";
  showLabels?: boolean;
  /** Desaturate collapsed panels, restoring full colour on the expanded one. */
  grayscale?: boolean;
  className?: string;
};

declare const AccordionGallery: (props: AccordionGalleryProps) => JSX.Element;

export default AccordionGallery;
