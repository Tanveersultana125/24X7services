"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { Kicker } from "./TextReveal";
import { Marquee } from "./Marquee";
import { TESTIMONIALS, type Testimonial } from "@/lib/content";
import { ReviewLightbox } from "@/components/reviews/ReviewLightbox";

// A few extra to make the wall feel full
const EXTRA: Testimonial[] = [
  { name: "Devika S.", city: "Karimnagar", rating: 5, appliance: "Bosch Washer", quote: "Booked at midnight, fixed by noon. The tracking alone is worth it.", initials: "DS", color: "#2547d0" },
  { name: "Arjun T.", city: "Khammam", rating: 5, appliance: "LG Fridge", quote: "Transparent quote, genuine part, spotless cleanup. Rare these days.", initials: "AT", color: "#0b9a63" },
  { name: "Sana K.", city: "Nalgonda", rating: 5, appliance: "IFB Microwave", quote: "The AI told me the fault before the technician even arrived. Wild.", initials: "SK", color: "#d9821b" },
];

/** Shown until enough real reviews are published, so the wall is never sparse. */
const SEEDED = [...TESTIMONIALS, ...EXTRA];

/** The marquee needs a few cards per row to read as a wall rather than a list. */
const MIN_CARDS = 6;

export function Reviews({
  reviews,
  count,
  average,
}: {
  /** Published customer reviews. Falls back to the seeded copy when there aren't enough yet. */
  reviews?: Testimonial[];
  count?: number;
  average?: number;
}) {
  const [opened, setOpened] = useState<Testimonial | null>(null);

  // Real reviews always lead. The seeded copy only tops the wall up so it never
  // looks sparse — the old rule dropped every real review until six existed, so
  // a customer's freshly published review didn't appear at all.
  const real = reviews ?? [];
  const all = real.length >= MIN_CARDS ? real : [...real, ...SEEDED];
  const half = Math.ceil(all.length / 2);
  const rowA = all.slice(0, half);
  const rowB = all.slice(half);

  // The badge switches to live numbers only once enough reviews exist to mean
  // anything. One 3-star review shouldn't make the wall read "3.0 · 1 review"
  // while every other figure on the page still says 4.9 out of 128,400.
  const liveSummary = (count ?? 0) >= MIN_CARDS;
  const ratingLabel = liveSummary && average && average > 0 ? average.toFixed(1) : "4.9";
  const countLabel = liveSummary
    ? `${(count as number).toLocaleString("en-IN")} verified review${count === 1 ? "" : "s"}`
    : "128,400 verified reviews";

  return (
    <section id="reviews" className="relative scroll-mt-28 overflow-hidden py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Kicker>In their words</Kicker>
            <h2 className="font-display mt-6 text-[2.6rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Three million homes.
              <br />
              <span className="italic text-royal-bright">One quiet standard.</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-premium-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-amber text-amber" />
              ))}
            </div>
            <div>
              <p className="font-semibold">{ratingLabel} / 5</p>
              <p className="text-xs text-muted">{countLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-5 sm:mt-16 sm:gap-6">
        <Marquee trackClassName="items-stretch gap-5 pr-5 sm:gap-6 sm:pr-6">
          {rowA.map((t, i) => <ReviewCard key={`a${i}`} t={t} onOpen={setOpened} />)}
        </Marquee>
        <Marquee reverse trackClassName="items-stretch gap-5 pr-5 sm:gap-6 sm:pr-6">
          {rowB.map((t, i) => <ReviewCard key={`b${i}`} t={t} onOpen={setOpened} />)}
        </Marquee>
      </div>

      <ReviewLightbox review={opened} onClose={() => setOpened(null)} />
    </section>
  );
}

function ReviewCard({ t, onOpen }: { t: Testimonial; onOpen: (t: Testimonial) => void }) {
  return (
    <figure
      role="button"
      tabIndex={0}
      onClick={() => onOpen(t)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(t);
        }
      }}
      /* A long review is clipped to five lines on the card, so the card opens
         to show the rest rather than leaving it half-read. */
      className="flex h-[18.5rem] w-[20.5rem] shrink-0 cursor-pointer flex-col rounded-[1.5rem] border border-border bg-surface p-6 shadow-premium-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-premium-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-bright sm:h-[19rem] sm:w-[23rem] sm:p-7"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < t.rating ? "size-4 fill-amber text-amber" : "size-4 fill-border text-border"
            }
          />
        ))}
      </div>

      <blockquote className="mt-5 line-clamp-5 text-pretty text-[0.95rem] leading-[1.65] text-ink-soft">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3 border-t border-hairline pt-5">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ background: t.color }}
        >
          {t.initials}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{t.name}</span>
            <BadgeCheck className="size-3.5 shrink-0 text-emerald" />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {t.appliance} · {t.city}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
