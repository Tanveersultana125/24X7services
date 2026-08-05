/**
 * The assistant widget lives at the root of the layout and owns its own open
 * state, so anything deeper in the tree opens it by firing this event rather
 * than by threading a callback (or, as before, linking to /book instead).
 */
export const OPEN_CHAT_EVENT = "24x7:open-chat";

export function openChatAssistant() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}
