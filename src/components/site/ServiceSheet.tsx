"use client";

import { useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Tag, Sparkles, Check, Clock } from "lucide-react";
import { bestSaving, tierSaving, type CatalogueService } from "@/lib/catalogue-shared";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Everything about one service, on top of the page that opened it.
 *
 * The strips can only carry a name and a price. This is where the rest lives:
 * what it costs for two units rather than one, what the visit includes, and
 * what people rate it. Booking from a tier carries the quantity through, so
 * the choice made here is the choice that arrives on the form.
 */
export function ServiceSheet({
  service,
  photo,
  onClose,
}: {
  service: CatalogueService | null;
  photo?: string;
  onClose: () => void;
}) {
  // The page behind must not scroll while this is over it, and Escape closes.
  useEffect(() => {
    if (!service) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [service, onClose]);

  if (typeof document === "undefined") return null;

  const saving = bestSaving(service?.tiers);

  return createPortal(
    <AnimatePresence>
      {service && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={service.name}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-premium-xl sm:rounded-[1.75rem]"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink/80"
            >
              <X className="size-4" />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="aspect-[16/9] w-full object-cover" />
              )}

              <div className="px-5 pt-5 sm:px-6">
                <h2 className="font-display text-2xl tracking-[-0.02em]">{service.name}</h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="size-3.5 fill-amber text-amber" />
                    {service.rating}
                    <span className="font-normal text-muted">({service.bookings} booked)</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted">
                    <Clock className="size-3.5" /> {service.serviceTime}
                  </span>
                </p>
                {saving > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald">
                    <Tag className="size-3.5" /> Add more &amp; save up to {saving}%
                  </p>
                )}
                {service.blurb && (
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{service.blurb}</p>
                )}
              </div>

              {/* Quantity tiers — one unit, two, three, each with its saving. */}
              {service.tiers && service.tiers.length > 0 && (
                <div className="mt-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:px-6">
                  {service.tiers.map((tier, i) => {
                    const off = tierSaving(tier);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "relative w-[9.5rem] shrink-0 rounded-2xl border p-3.5",
                          tier.badge ? "border-royal-bright" : "border-border",
                        )}
                      >
                        {tier.badge && (
                          <span className="absolute -top-2.5 left-3 rounded-full bg-royal-bright px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                            {tier.badge}
                          </span>
                        )}
                        <p className="text-sm font-medium">
                          {tier.qty} {tier.qty === 1 ? "unit" : "units"}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          {formatINR(tier.price)}
                          {tier.was && (
                            <span className="ml-1.5 font-normal text-muted-2 line-through">
                              {formatINR(tier.was)}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          ({formatINR(Math.round(tier.price / tier.qty))} each)
                        </p>
                        {off > 0 && <p className="mt-1 text-xs font-medium text-emerald">{off}% off</p>}
                        <Link
                          href={`/book?appliance=${service.id}&qty=${tier.qty}`}
                          className="mt-3 block rounded-lg border border-royal-bright px-3 py-1.5 text-center text-xs font-semibold text-royal-bright transition-colors hover:bg-royal-bright hover:text-white"
                        >
                          Add
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}

              {(service.headline || (service.highlights?.length ?? 0) > 0) && (
                <div className="mt-6 border-t border-hairline px-5 py-5 sm:px-6">
                  <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-amber">
                    <Sparkles className="size-3.5" /> Highlights
                  </p>
                  {service.headline && (
                    <p className="mt-3 text-pretty text-lg font-medium leading-snug">{service.headline}</p>
                  )}
                  {service.highlights && service.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2.5">
                      {service.highlights.map((h) => (
                        <li key={h} className="flex gap-2.5 text-sm text-ink-soft">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald" strokeWidth={2.4} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Always reachable, however long the sheet runs. */}
            <div className="border-t border-hairline bg-surface p-4 sm:px-6">
              <Link
                href={`/book?appliance=${service.id}`}
                className="flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Book {service.name} · from {formatINR(service.startingPrice)}
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
