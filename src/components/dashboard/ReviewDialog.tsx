"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReviewForm, type ReviewTarget } from "@/components/reviews/ReviewForm";

const ease = [0.16, 1, 0.3, 1] as const;

export type { ReviewTarget };

/** The dashboard's way into the review form — /reviews/new shows the same form on a page. */
export function ReviewDialog({
  target,
  onClose,
  onSubmitted,
}: {
  target: ReviewTarget | null;
  onClose: () => void;
  /** Fired once the review is stored, so the dashboard can flip the row to "Rated". */
  onSubmitted: (bookingId: string) => void;
}) {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Review your ${target.appliance} service`}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            className="relative w-full max-w-[32rem] overflow-hidden rounded-[1.75rem] border border-border bg-surface p-6 shadow-premium-xl ring-1 ring-black/5 sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>

            {/* Keyed on the booking so opening a different job starts from a clean form. */}
            <ReviewForm
              key={target.bookingId}
              target={target}
              onCancel={onClose}
              onSubmitted={onSubmitted}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
