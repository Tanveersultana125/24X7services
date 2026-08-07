/**
 * Changes to the cards that ship with the homepage strips.
 *
 * Those cards live in the components — they are the design, and deleting one
 * from the code would be a deploy. An admin can still rewrite what a card says
 * or take it off the site; both are stored here, keyed by the same slot key the
 * card's photo uses, and both are reversible.
 */

export type SectionOverride = {
  /** Off the site, without being removed from the code. */
  hidden?: boolean;
  title?: string;
  sub?: string;
  cta?: string;
  href?: string;
  tint?: string;
  price?: number;
  rating?: number;
  meta?: string;
  badge?: string;
};

export type SectionOverrides = Record<string, SectionOverride>;

/** Fields the caller is allowed to set — anything else in a request is ignored. */
export const OVERRIDE_TEXT_FIELDS = ["title", "sub", "cta", "href", "tint", "meta", "badge"] as const;
export const OVERRIDE_NUMBER_FIELDS = ["price", "rating"] as const;
