"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, ArrowLeft, ArrowRight } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/content";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

type Source = "google" | "justdial";

const SOURCES: Record<Source, { label: string; mark: string; tint: string }> = {
  google: { label: "Google", mark: "G", tint: "#4285F4" },
  justdial: { label: "Justdial", mark: "J", tint: "#0b9a63" },
};

/** The base testimonials carry no review-platform metadata — attach it here. */
const REVIEWS: (Testimonial & { source: Source; ago: string })[] = TESTIMONIALS.map((t, i) => ({
  ...t,
  source: i % 2 === 0 ? "google" : "justdial",
  ago: ["1 month ago", "14 days ago", "24 days ago", "2 months ago", "5 days ago"][i] ?? "recently",
}));

const FILTERS: { id: "all" | Source; label: string }[] = [
  { id: "all", label: "All reviews" },
  { id: "google", label: "Google" },
  { id: "justdial", label: "Justdial" },
];

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | Source>("all");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const items = REVIEWS.filter((r) => filter === "all" || r.source === filter);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
    setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
  }, []);

  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
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

        {/* source tabs */}
        <div className="mt-8 flex justify-center">
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

        {/* cards */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((r) => (
            <article
              key={r.name}
              className="flex min-h-full shrink-0 basis-[86%] snap-start flex-col rounded-[1.5rem] border border-border bg-surface p-6 shadow-premium-sm sm:basis-[47%] lg:basis-[calc(33.333%-0.834rem)]"
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
                <SourceMark source={r.source} className="size-7 text-xs" />
                <div className="leading-none">
                  <p className="text-[0.65rem] text-muted">Posted on</p>
                  <p className="mt-1 text-[0.72rem] font-semibold text-ink">{SOURCES[r.source].label}</p>
                </div>
                <span className="ml-auto text-[0.65rem] text-muted-2">{r.city}</span>
              </footer>
            </article>
          ))}
        </div>

        {/* controls */}
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            onClick={() => nudge(-1)}
            aria-label="Previous reviews"
            className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex items-center gap-1.5">
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

          <button
            onClick={() => nudge(1)}
            aria-label="More reviews"
            className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <ArrowRight className="size-4" />
          </button>
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
