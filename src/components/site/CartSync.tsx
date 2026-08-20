"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { visitorId } from "@/lib/visitor";
import { useSession } from "./AccountMenu";

/**
 * Mirrors the basket to the server whenever it changes.
 *
 * The basket is the browser's — this only sends a copy, so the panel can see
 * what people are picking. A signed-out visitor is identified by a random id
 * kept alongside the basket itself; once they sign in the session cookie takes
 * over and the basket moves onto their account.
 *
 * Nothing here is allowed to matter: if the send fails the basket carries on
 * working exactly as before.
 */

const SENT_KEY = "24x7-cart-sent";

export function CartSync() {
  const items = useCart();
  const user = useSession();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // `undefined` is "session not known yet" — sending now would file a
    // signed-in customer's basket under a guest id.
    if (user === undefined) return;

    const payload = JSON.stringify({ who: user?.email ?? "guest", items });
    // Every page load re-renders the same basket. Only a real change is worth
    // a request, or the panel would show every visit as fresh activity.
    let sent = "";
    try {
      sent = window.localStorage.getItem(SENT_KEY) ?? "";
    } catch {
      /* unreadable store — treat as never sent */
    }
    if (sent === payload) return;
    // An empty basket that was never sent is just a visitor who hasn't added
    // anything — there is nothing on the server to clear.
    if (items.length === 0 && !sent) return;

    const visitor = visitorId();
    if (!visitor && !user) return;

    if (timer.current) window.clearTimeout(timer.current);
    // Adding three things in a row is one basket, not three.
    timer.current = window.setTimeout(() => {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor, items }),
        keepalive: true,
      })
        .then((r) => {
          if (!r.ok) return;
          try {
            window.localStorage.setItem(SENT_KEY, payload);
          } catch {
            /* nothing to remember it with — it will send again next time */
          }
        })
        .catch(() => {});
    }, 700);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [items, user]);

  return null;
}
