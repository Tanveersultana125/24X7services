"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { visitorId } from "@/lib/visitor";
import type { ActivityEvent } from "@/lib/activity-shared";

/**
 * Reports what a visitor opens and presses, so the panel can see it.
 *
 * One listener on the document rather than a handler on every control: the
 * site has hundreds of links and buttons, and a scheme that needs each of them
 * to remember to report itself is a scheme that misses the ones added later.
 * The capture phase, because a card that stops its own click from bubbling is
 * exactly the kind of press worth knowing about.
 *
 * Presses are buffered and sent in batches. Clicking through a carousel is a
 * burst, and a request per press would cost more than the answer is worth — a
 * few seconds of it arrives as one write.
 *
 * Who the visitor is, the server reads from the session cookie; all this sends
 * is the browser's own random id, for the trail built before anyone signs in.
 *
 * Nothing here is allowed to matter. A failed send is dropped and the site
 * carries on: the trail is a convenience for the office, never something a
 * visitor should be able to notice.
 */

/** Send at most this often; a burst of clicking still arrives as one batch. */
const FLUSH_MS = 4000;
/** Send early once a batch reaches this — a long burst shouldn't wait. */
const BATCH = 20;
/** The server takes 40; stop short so a batch is never rejected whole. */
const MAX_BUFFER = 30;
/** Enough words to recognise the control, not enough to store a paragraph. */
const MAX_LABEL = 90;

/** The words on a control: what it says it is, then what it reads as. */
function labelFor(el: Element): string {
  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria.slice(0, MAX_LABEL);
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const title = el.getAttribute("title")?.trim();
  return (text || title || "").slice(0, MAX_LABEL);
}

export function ActivityTracker() {
  const pathname = usePathname();
  const buffer = useRef<ActivityEvent[]>([]);
  const timer = useRef<number | null>(null);
  /** Set by the effect below so the page-view effect can use it too. */
  const push = useRef<(event: ActivityEvent) => void>(() => {});

  // The panel is the office's own screen. Following it would fill the trail
  // with the people reading it.
  const off = pathname.startsWith("/admin");

  useEffect(() => {
    if (off) return;

    const send = () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      const events = buffer.current;
      if (events.length === 0) return;
      buffer.current = [];

      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor: visitorId(), events }),
        // The last batch is sent as the page goes away, and a plain fetch is
        // cancelled along with it.
        keepalive: true,
      }).catch(() => {});
    };

    push.current = (event: ActivityEvent) => {
      // A page left open behind a failing send must not grow without end.
      if (buffer.current.length >= MAX_BUFFER) buffer.current.shift();
      buffer.current.push(event);
      if (buffer.current.length >= BATCH) return send();
      if (timer.current) return;
      timer.current = window.setTimeout(send, FLUSH_MS);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const control = target?.closest?.("a, button, [role='button']");
      if (!control) return;
      // An opt-out for controls that would only add noise.
      if (control.closest("[data-no-track]")) return;

      const label = labelFor(control);
      const href = control.getAttribute("href") ?? "";
      push.current({
        kind: "click",
        path: window.location.pathname,
        at: Date.now(),
        ...(label ? { label } : {}),
        // Only our own routes are worth printing beside a row; an outbound
        // link or a bare "#" says nothing the label doesn't.
        ...(href.startsWith("/") ? { href } : {}),
      });
    };

    // A page put away is a page whose last batch has nowhere else to go.
    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [off]);

  // A page opened is the first thing a trail should say, and it is what gives
  // the presses after it somewhere to have happened.
  useEffect(() => {
    if (off) return;
    push.current({ kind: "view", path: pathname, at: Date.now() });
  }, [pathname, off]);

  return null;
}
