/**
 * The shape of one thing a visitor did.
 *
 * The browser records these and the panel prints them, so the type lives
 * outside the `server-only` data layer where both can reach it.
 */
export type ActivityEvent = {
  /** A page opened, or something pressed on it. */
  kind: "view" | "click";
  /** The page it happened on. */
  path: string;
  /** The words on the thing pressed, or its aria-label. */
  label?: string;
  /** Where the link went, for the presses that were links. */
  href?: string;
  /** When the browser recorded it. */
  at: number;
};
