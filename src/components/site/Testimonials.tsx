"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { TESTIMONIALS, type Testimonial, type ReviewCard } from "@/lib/content";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type Source = "google" | "justdial";

const SOURCES: Record<Source, { label: string; mark: string; tint: string }> = {
  google: { label: "Google", mark: "G", tint: "#4285F4" },
  justdial: { label: "Justdial", mark: "J", tint: "#0b9a63" },
};

type Card = Testimonial & { source?: Source; ago: string };

/** The seeded testimonials carry no review-platform metadata — attach it here. */
const SEEDED: Card[] = TESTIMONIALS.map((t, i) => ({
  ...t,
  source: i % 2 === 0 ? "google" : "justdial",
  ago: ["1 month ago", "14 days ago", "24 days ago", "2 months ago", "5 days ago"][i] ?? "recently",
}));

const FILTERS: { id: "all" | Source; label: string }[] = [
  { id: "all", label: "All reviews" },
  { id: "google", label: "Google" },
  { id: "justdial", label: "Justdial" },
];

/** "3 days ago" / "2 months ago" from an epoch-millis timestamp. */
function timeAgo(ms: number): string {
  if (!ms) return "recently";
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function Testimonials({ reviews }: { reviews?: ReviewCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | Source>("all");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  // Real reviews come from our own booking flow, so the Google/Justdial
  // filter only applies to the seeded platform copy.
  const real = reviews && reviews.length > 0;
  const cards: Card[] = real
    ? reviews.map((r) => ({ ...r, ago: timeAgo(r.createdAt) }))
    : SEEDED;

  const items = real ? cards : cards.filter((r) => filter === "all" || r.source === filter);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
    setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
  }, []);

  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    // step by a card plus the gap, so each press lands on a snap point
    const card = el.querySelector<HTMLElement>("[data-card]");
    // the gap is padding inside the sizer, so its own width is one step
    const step = card ? card.offsetWidth : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section id="reviews" className="relative scroll-mt-28 py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center"
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted">
            Testimonials
          </p>
          <h2 className="font-display mx-auto mt-4 max-w-3xl text-[2rem] leading-[1.08] tracking-[-0.03em] sm:text-[3.2rem]">
            Satisfied customers <span className="italic text-royal-bright">sing our praises</span>
          </h2>
        </motion.div>

        {/* source tabs — only meaningful for the seeded platform copy */}
        <div className={cn("mt-8 flex justify-center", real && "hidden")}>
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-premium-sm">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilter(f.id);
                    trackRef.current?.scrollTo({ left: 0 });
                    setPage(0);
                  }}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[0.78rem] font-medium transition-colors sm:px-5 sm:text-sm",
                    active ? "text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="testimonial-tab"
                      className="absolute inset-0 rounded-full bg-surface-2"
                      transition={{ duration: 0.35, ease }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {f.id !== "all" && <SourceMark source={f.id} className="size-4 text-[0.55rem]" />}
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* cards — the arrows keep their own lane beside the card at every size */}
        <div className="relative mt-12">
          <button
            onClick={() => nudge(-1)}
            aria-label="Previous reviews"
            className="absolute left-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:size-10"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={() => nudge(1)}
            aria-label="More reviews"
            className="absolute right-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:size-10"
          >
            <ArrowRight className="size-4" />
          </button>

          <div className="mx-9 overflow-hidden sm:mx-12">
        <div
          ref={trackRef}
          onScroll={onScroll}
          data-lenis-prevent
          /* The strip runs wider than the box that clips it, so the next card's
             border and its 8px shadow both fall outside the edge instead of
             drawing a hairline in the arrow's gutter. */
          className="-mr-3 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((r, idx) => (
            /* sizer carries the gap as padding, so plain fractions give
               exactly 1 / 2 / 3 whole cards per row */
            <div
              key={`${r.name}-${idx}`}
              data-card
              className="w-full shrink-0 snap-start pr-5 sm:w-1/2 lg:w-1/3"
            >
            <article
              className="flex h-full flex-col rounded-[1.5rem] border border-border bg-surface p-6 shadow-premium-sm"
            >
              <header className="flex items-center gap-3">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{ background: r.color }}
                >
                  {r.initials}
                </span>
                <div className="leading-none">
                  <p className="text-sm font-semibold text-ink">{r.name}</p>
                  <p className="mt-1.5 text-xs text-muted">{r.ago}</p>
                </div>
              </header>

              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber text-amber" />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-pretty text-[0.92rem] italic leading-relaxed text-muted">
                &ldquo;{r.quote}&rdquo;
              </blockquote>

              <footer className="mt-6 flex items-center gap-2.5 border-t border-hairline pt-4">
                {r.source ? (
                  <>
                    <SourceMark source={r.source} className="size-7 text-xs" />
                    <div className="leading-none">
                      <p className="text-[0.65rem] text-muted">Posted on</p>
                      <p className="mt-1 text-[0.72rem] font-semibold text-ink">{SOURCES[r.source].label}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald/12 text-emerald">
                      <BadgeCheck className="size-4" />
                    </span>
                    <div className="min-w-0 leading-none">
                      <p className="text-[0.65rem] text-muted">Verified booking</p>
                      <p className="mt-1 truncate text-[0.72rem] font-semibold text-ink">{r.appliance}</p>
                    </div>
                  </>
                )}
                <span className="ml-auto shrink-0 pl-2 text-[0.65rem] text-muted-2">{r.city}</span>
              </footer>
            </article>
            </div>
          ))}
        </div>
          </div>
        </div>

        {/* position dots — the arrows now live beside the cards */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === page ? "w-5 bg-royal-bright" : "w-1.5 bg-border-strong"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceMark({ source, className }: { source: Source; className?: string }) {
  const s = SOURCES[source];
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full font-bold", className)}
      style={{ background: `${s.tint}1a`, color: s.tint }}
    >
      {s.mark}
    </span>
  );
}
