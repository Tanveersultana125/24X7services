"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Kicker } from "./TextReveal";

const DIST = [
  { stars: 5, pct: 92 },
  { stars: 4, pct: 6 },
  { stars: 3, pct: 1.4 },
  { stars: 2, pct: 0.4 },
  { stars: 1, pct: 0.2 },
];

const CATEGORIES = [
  { label: "Punctuality", value: 4.9 },
  { label: "Repair quality", value: 4.9 },
  { label: "Cleanliness", value: 4.8 },
  { label: "Value for money", value: 4.7 },
];

export function RatingBreakdown() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>The numbers behind the stars</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Rated 4.9, and here&apos;s why.
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Overall + distribution */}
          <div className="rounded-[1.75rem] border border-border bg-surface p-8 sm:p-10">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="font-display text-6xl tracking-tighter">4.9</p>
                <div className="mt-2 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber text-amber" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">128,400 reviews</p>
              </div>
              <div className="flex-1 space-y-2.5">
                {DIST.map((d) => (
                  <div key={d.stars} className="flex items-center gap-3">
                    <span className="flex w-8 items-center gap-1 text-xs text-muted">
                      {d.stars} <Star className="size-3 fill-muted-2 text-muted-2" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-amber"
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-muted">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category ratings */}
          <div className="flex flex-col justify-center gap-6">
            {CATEGORIES.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.label}</span>
                  <span className="font-display text-lg">{c.value.toFixed(1)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(c.value / 5) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-royal-bright to-emerald"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
