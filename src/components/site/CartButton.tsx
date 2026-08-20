"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, ArrowUpRight } from "lucide-react";
import { bookHref, cartTotal, clearCart, lineKey, OPEN_CART_EVENT, removeFromCart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/utils";

/**
 * The basket, in the nav.
 *
 * The booking form takes one appliance at a time, so this doesn't pretend to
 * check out several at once: each line books itself, and the total is there to
 * show what the visit adds up to. That is honest about what happens next
 * rather than collecting three services into a button that can only carry one.
 */
export function CartButton() {
  const items = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // "View" on the bar that confirms an addition opens this, so the basket is
  // one press away from the card rather than a hunt up in the nav.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_CART_EVENT, show);
    return () => window.removeEventListener(OPEN_CART_EVENT, show);
  }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={count ? `Basket, ${count} items` : "Basket"}
        className="relative grid size-9 shrink-0 place-items-center rounded-full glass text-foreground transition-colors hover:bg-surface sm:size-10"
      >
        <ShoppingCart className="size-[18px]" />
        {/* The store reports an empty basket to the server, so this is absent
            in the markup React hydrates and appears once the real one is read
            — no mismatch to warn about. */}
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-royal-bright px-1 text-[0.6rem] font-bold leading-4 text-white">
            {count}
          </span>
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[95] flex justify-end bg-ink/50 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label="Basket"
              >
                <motion.aside
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 24, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-premium-xl"
                >
                  <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                    <h2 className="font-display text-lg tracking-[-0.02em]">Your basket</h2>
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted-2">
                        <ShoppingCart className="size-5" />
                      </span>
                      <p className="mt-4 font-medium">Nothing added yet</p>
                      <p className="mt-1.5 text-sm text-muted">
                        Open a service and add an offer — it waits here until you book it.
                      </p>
                      <Link
                        href="/services"
                        onClick={() => setOpen(false)}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                      >
                        Browse services <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <ul className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
                        {items.map((item) => (
                          <li key={lineKey(item)} className="flex items-start gap-3 px-5 py-4">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.name}</p>
                              {/* The fault is what was actually picked — without
                                  it two lines of the same appliance read as a
                                  duplicate rather than as two jobs. */}
                              {item.problemLabel && (
                                <p className="mt-0.5 truncate text-xs text-royal-bright">{item.problemLabel}</p>
                              )}
                              <p className="mt-0.5 text-xs text-muted">
                                {item.kind === "plan"
                                  ? "Annual plan"
                                  : `${item.qty} ${item.qty === 1 ? "unit" : "units"}`}{" "}
                                · {formatINR(item.price)}
                              </p>
                              <Link
                                href={bookHref(item)}
                                onClick={() => setOpen(false)}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-royal-bright hover:underline"
                              >
                                Book this <ArrowUpRight className="size-3.5" />
                              </Link>
                            </div>
                            <button
                              onClick={() => removeFromCart(lineKey(item))}
                              aria-label={`Remove ${item.name}`}
                              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                            >
                              <X className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>

                      <div className="border-t border-hairline p-5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-muted">Total</span>
                          <span className="font-display text-2xl tracking-tight">
                            {formatINR(cartTotal(items))}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <p className="mt-2 text-xs text-muted">
                            Each service is booked on its own visit — book them one at a time above.
                          </p>
                        )}
                        <Link
                          href={bookHref(items[0])}
                          onClick={() => setOpen(false)}
                          className="mt-4 flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-background transition-opacity hover:opacity-90"
                        >
                          Book {items[0].name}
                        </Link>
                        <button
                          onClick={clearCart}
                          className="mt-2 w-full rounded-full py-2 text-xs font-medium text-muted hover:text-ink"
                        >
                          Empty basket
                        </button>
                      </div>
                    </>
                  )}
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
