"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export type LightboxImage = { src: string; label: string };

/**
 * Full-screen viewer for photos the page shows small.
 *
 * Pass the whole set and the index that was clicked: a single photo simply
 * omits the arrows. Escape and the backdrop close it; the arrow keys move
 * through a set, which is the reason this handles a list rather than one image.
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  /** null when closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const open = index !== null;
  const many = images.length > 1;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // The page behind shouldn't scroll while a photo is filling the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, step]);

  const current = index === null ? null : images[index];

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={current.label}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <X className="size-5" />
          </button>

          {many && (
            <>
              <button
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:left-6 sm:size-12"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:right-6 sm:size-12"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <motion.figure
            key={current.src}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            className="relative flex max-h-full max-w-[80rem] flex-col items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.label}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-premium-xl"
            />
            <figcaption className="mt-4 flex items-center gap-3 text-sm text-white/80">
              <span>{current.label}</span>
              {many && (
                <span className="text-white/50">
                  {(index ?? 0) + 1} / {images.length}
                </span>
              )}
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
