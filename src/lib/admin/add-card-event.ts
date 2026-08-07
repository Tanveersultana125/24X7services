/**
 * The upload shelf and the card editor sit in two different components on the
 * same page. Rather than lift their state into a shared parent for one
 * hand-off, the shelf asks for a card and the editor answers.
 */
export const ADD_CARD_EVENT = "24x7:admin-add-card";

export type AddCardRequest = { src: string };

/** Open the "add a card" dialog with this photo already chosen. */
export function requestCardForImage(src: string) {
  window.dispatchEvent(new CustomEvent<AddCardRequest>(ADD_CARD_EVENT, { detail: { src } }));
}
