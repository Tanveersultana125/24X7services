"use client";

import { Star, BadgeCheck } from "lucide-react";
import { Kicker } from "./TextReveal";
import { Marquee } from "./Marquee";
import { TESTIMONIALS, type Testimonial } from "@/lib/content";

// A few extra to make the wall feel full
const EXTRA: Testimonial[] = [
  { name: "Devika S.", city: "Pune", rating: 5, appliance: "Bosch Washer", quote: "Booked at midnight, fixed by noon. The tracking alone is worth it.", initials: "DS", color: "#2547d0" },
  { name: "Arjun T.", city: "Kochi", rating: 5, appliance: "LG Fridge", quote: "Transparent quote, genuine part, spotless cleanup. Rare these days.", initials: "AT", color: "#0b9a63" },
  { name: "Sana K.", city: "Jaipur", rating: 5, appliance: "IFB Microwave", quote: "The AI told me the fault before the technician even arrived. Wild.", initials: "SK", color: "#d9821b" },
];

const ALL = [...TESTIMONIALS, ...EXTRA];
const rowA = ALL.slice(0, 4);
const rowB = ALL.slice(4).concat(ALL.slice(0, 2));

export function Reviews() {
  return (
    <section id="reviews" className="relative scroll-mt-28 overflow-hidden py-28 sm:py-36">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Kicker>In their words</Kicker>
            <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
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
              <p className="font-semibold">4.9 / 5</p>
              <p className="text-xs text-muted">128,400 verified reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-5">
        <Marquee>
          {rowA.map((t, i) => <ReviewCard key={`a${i}`} t={t} />)}
        </Marquee>
        <Marquee reverse>
          {rowB.map((t, i) => <ReviewCard key={`b${i}`} t={t} />)}
        </Marquee>
      </div>
    </section>
  );
}

function ReviewCard({ t }: { t: Testimonial }) {
  return (
    <figure className="flex w-[22rem] shrink-0 flex-col gap-4 rounded-[1.5rem] border border-border bg-surface p-6 shadow-premium-sm">
      <div className="flex items-center gap-1">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="size-4 fill-amber text-amber" />
        ))}
      </div>
      <blockquote className="text-pretty leading-relaxed text-ink-soft">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-2">
        <span className="grid size-10 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: t.color }}>
          {t.initials}
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {t.name} <BadgeCheck className="size-3.5 text-emerald" />
          </p>
          <p className="text-xs text-muted">{t.appliance} · {t.city}</p>
        </div>
      </figcaption>
    </figure>
  );
}
