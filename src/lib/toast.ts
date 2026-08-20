"use client";

/**
 * A short message that appears over the page and takes itself away.
 *
 * The bar lives at the root of the layout and owns its own state, so anything
 * deeper in the tree raises a message by firing this event rather than by
 * threading a callback down to it — the same arrangement the chat widget uses.
 */

export const TOAST_EVENT = "24x7:toast";

export type Toast = {
  /** Decides the colour and the glyph: something kept, or something dropped. */
  tone: "added" | "removed";
  title: string;
  /** What it was — the service's name, or how many of them. */
  detail?: string;
  /** Show the "View basket" button. Nothing to view after a removal. */
  basket?: boolean;
};

export function toast(message: Toast) {
  window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: message }));
}
