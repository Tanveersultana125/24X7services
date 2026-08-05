"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, BadgeCheck, X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export type OpenedReview = {
  name: string;
  initials: string;
  color: string;
  rating: number;
  quote: string;
  appliance: string;
  city: string;
  /** "14 days ago" — the carousel has it, the wall doesn't. */
  ago?: string;
};

/**
 * The full text of one review. Cards clip long quotes to keep the wall even, so
 * this is where a visitor actually reads one.
 */
export function ReviewLightbox({
  review,
  onClose,
}: {
  review: OpenedReview | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!review) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [review, onClose]);

  return (
    <AnimatePresence>
      {review && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Review by ${review.name}`}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            className="relative w-full max-w-[34rem] rounded-[1.75rem] border border-border bg-surface p-6 shadow-premium-xl sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < review.rating
                      ? "size-4 fill-amber text-amber"
                      : "size-4 fill-border text-border"
                  }
                />
              ))}
              {review.ago && <span className="ml-2 text-xs text-muted">{review.ago}</span>}
            </div>

            <blockquote className="mt-5 max-h-[50vh] overflow-y-auto text-pretty text-[1.02rem] leading-[1.7] text-ink-soft">
              &ldquo;{review.quote}&rdquo;
            </blockquote>

            <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ background: review.color }}
              >
                {review.initials}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{review.name}</span>
                  <BadgeCheck className="size-4 shrink-0 text-emerald" />
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {[review.appliance, review.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
