"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Tag, Sparkles, Check, Clock, Info, ShieldCheck, ChevronDown } from "lucide-react";
import { bestSaving, tierSaving, type CatalogueService } from "@/lib/catalogue-shared";
import { BRANDS } from "@/lib/data";
import { BrandMark } from "@/components/ui/Icons";
import { addToCart } from "@/lib/cart";
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
  const [added, setAdded] = useState<number | null>(null);

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
                        {/* Adds to the basket rather than leaving for the
                            booking form — the point of picking a tier is to
                            keep looking, and the nav carries it from here. */}
                        <button
                          onClick={() => {
                            addToCart({
                              id: service.id,
                              name: service.name,
                              qty: tier.qty,
                              price: tier.price,
                            });
                            setAdded(tier.qty);
                            window.setTimeout(
                              () => setAdded((cur) => (cur === tier.qty ? null : cur)),
                              1600,
                            );
                          }}
                          className="mt-3 w-full rounded-lg border border-royal-bright px-3 py-1.5 text-center text-xs font-semibold text-royal-bright transition-colors hover:bg-royal-bright hover:text-white"
                        >
                          {added === tier.qty ? "Added ✓" : "Add"}
                        </button>
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

              {/* How the visit runs, in the order it runs. */}
              {service.process && service.process.length > 0 && (
                <Section title="Our process">
                  <ol className="mt-4 space-y-5">
                    {service.process.map((step, i) => (
                      <li key={i} className="relative pl-9">
                        <span className="absolute left-0 top-0 grid size-6 place-items-center rounded-full border border-border text-[0.68rem] font-semibold text-muted">
                          {i + 1}
                        </span>
                        {/* the rail joins a step to the next, not past the last */}
                        {i < service.process!.length - 1 && (
                          <span aria-hidden className="absolute left-3 top-7 h-[calc(100%-0.5rem)] w-px bg-border" />
                        )}
                        <p className="text-sm font-semibold">{step.title}</p>
                        {step.body && (
                          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted">{step.body}</p>
                        )}
                        {step.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={step.image}
                            alt=""
                            className="mt-3 aspect-[16/10] w-full rounded-xl object-cover"
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {service.included && service.included.length > 0 && (
                <Section title="What's included">
                  <ul className="mt-4 space-y-3">
                    {service.included.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald text-white">
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {service.youNeed && service.youNeed.length > 0 && (
                <Section title="What we will need from you">
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {service.youNeed.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl bg-surface-2 p-3 text-xs font-medium leading-snug text-ink-soft"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {service.pleaseNote && service.pleaseNote.length > 0 && (
                <Section title="Please note">
                  <ul className="mt-4 space-y-3">
                    {service.pleaseNote.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-muted">
                        <Info className="mt-0.5 size-4 shrink-0 text-muted-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* The four we are authorised for — the same list the site keeps
                  everywhere, so it can't drift from the brands page. */}
              <Section title="Brands we service">
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {BRANDS.map((b) => (
                    <span
                      key={b.id}
                      className="grid h-14 place-items-center rounded-xl bg-white px-3 ring-1 ring-black/5"
                    >
                      <BrandMark id={b.id} tone="brand" className={b.id === "lg" ? "text-2xl" : "text-[0.7rem]"} />
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Top professionals">
                <ul className="mt-4 space-y-3">
                  {["Background verified", "Trained on every brand we service", "90-day written warranty on the repair"].map(
                    (item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </Section>

              {service.faqs && service.faqs.length > 0 && (
                <Section title="Frequently asked questions">
                  <div className="mt-2 divide-y divide-hairline">
                    {service.faqs.map((faq, i) => (
                      <Faq key={i} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </Section>
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

/** A titled block, so every section of the sheet is spaced the same way. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-hairline px-5 py-5 sm:px-6">
      <h3 className="font-display text-lg tracking-[-0.02em]">{title}</h3>
      {children}
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-medium"
      >
        {q}
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="pb-4 text-pretty text-sm leading-relaxed text-muted">{a}</p>}
    </div>
  );
}
