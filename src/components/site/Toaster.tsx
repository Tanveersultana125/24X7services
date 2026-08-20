"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, ShoppingCart, X } from "lucide-react";
import { openCart } from "@/lib/cart";
import { TOAST_EVENT, type Toast } from "@/lib/toast";

/**
 * The bar that says what just happened.
 *
 * Adding a service used to change a small button in the corner of a card and
 * nothing else. On a card near the bottom of a long strip that is a change
 * nobody sees, so the press felt like it had done nothing at all. This says it
 * plainly, offers the one thing anybody wants next, and leaves.
 *
 * One message at a time, replaced rather than stacked: adding three services
 * in a row is one piece of news three times over, and a column of bars climbing
 * the screen would cover the cards being pressed.
 */

/** Long enough to read, short enough not to sit in the way. */
const LINGER_MS = 3600;

export function Toaster() {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const timer = useRef<number | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<Toast>).detail;
      if (!detail) return;
      // A new message restarts the clock: the last thing pressed is the thing
      // worth reading, and it gets its full time on screen.
      if (timer.current) window.clearTimeout(timer.current);
      setToast({ ...detail, id: nextId.current++ });
      timer.current = window.setTimeout(() => setToast(null), LINGER_MS);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const added = toast?.tone === "added";

  return (
    <div
      // Above the chat button on a phone, where a centred bar would otherwise
      // sit on top of it; beside it on anything wider. Below the basket panel's
      // own layer, so a message can never cover the thing it is about.
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex justify-center sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-card-edge bg-card/95 p-3 shadow-premium-lg backdrop-blur-xl dark:border-white/[0.12]"
          >
            <span
              className={
                "grid size-9 shrink-0 place-items-center rounded-xl " +
                (added ? "bg-emerald text-white" : "bg-surface-2 text-muted")
              }
            >
              {added ? (
                <Check className="size-4" strokeWidth={2.8} />
              ) : (
                <Minus className="size-4" strokeWidth={2.8} />
              )}
            </span>

            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[0.9rem] font-semibold tracking-tight">{toast.title}</span>
              {toast.detail && (
                <span className="mt-0.5 block truncate text-xs text-muted">{toast.detail}</span>
              )}
            </span>

            {toast.basket && (
              <button
                type="button"
                onClick={() => {
                  openCart();
                  dismiss();
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
              >
                <ShoppingCart className="size-3.5" /> View
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
