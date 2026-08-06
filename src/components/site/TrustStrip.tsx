"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

const PILLARS = [
  {
    icon: ShieldCheck,
    tint: "#2547d0",
    title: "Trustworthiness",
    desc: "Brand-authorised technicians, 100% genuine spare parts, and a 90-day warranty on every single repair.",
  },
  {
    icon: BadgeCheck,
    tint: "#0b9a63",
    title: "Professionalism",
    desc: "Trained, background-verified pros who arrive on time, in uniform, and treat your home with real care.",
  },
  {
    icon: Star,
    tint: "#d9821b",
    title: "Customer Satisfaction",
    desc: "Rated 4.9/5 across 128k+ services — with live technician tracking and transparent, upfront pricing.",
  },
];

export function TrustStrip() {
  return (
    <section className="relative z-20 -mt-8 pb-6 pt-4 sm:-mt-32 sm:pb-8 sm:pt-6">
      {/* Glass needs something to refract. Below the hero the cards would sit
          on flat paint, so each pillar gets a soft wash of its own colour
          behind the row — invisible as a shape, present as light. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[8%] top-1/2 size-72 -translate-y-1/2 rounded-full bg-royal-bright/20 blur-[90px] dark:bg-royal-bright/15" />
        <span className="absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-emerald/15 blur-[90px] dark:bg-emerald/12" />
        <span className="absolute right-[8%] top-1/2 size-72 -translate-y-1/2 rounded-full bg-amber/15 blur-[90px] dark:bg-amber/12" />
      </div>

      <div className="relative mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
              /* Glass, not paint: the card is translucent and blurs whatever
                 passes behind it — the hero above, the colour wash below. Its
                 depth is a lit top edge and a rim, since a drop shadow does
                 nothing on a dark page. */
              style={{ "--tint": p.tint } as React.CSSProperties}
              className="group relative overflow-hidden rounded-[1.1rem] border border-white/60 bg-white/55 p-3 text-center backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[1.75rem] sm:p-7 sm:text-left shadow-[0_18px_40px_-18px_rgba(23,21,15,0.18),inset_0_1.5px_0_rgba(255,255,255,0.85)] transition-all duration-500 hover:-translate-y-2 hover:bg-white/65 hover:shadow-[0_38px_64px_-24px_rgba(23,21,15,0.3),inset_0_1.5px_0_rgba(255,255,255,0.9)] dark:border-white/[0.10] dark:bg-[rgba(12,12,15,0.55)] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.10)] dark:hover:border-white/[0.18] dark:hover:bg-[rgba(12,12,15,0.45)] dark:hover:shadow-[0_40px_80px_-34px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              {/* glossy top sheen */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.05]" />

              {/* the tile's own colour, breathed on by the card's hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 hidden size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:block"
                style={{ background: `color-mix(in srgb, var(--tint) 22%, transparent)` }}
              />

              <span
                /* A tint at 9% is a colour on paper and a smudge on black:
                   dark gets more of it, a rim, and a lighter icon. */
                className="relative mx-auto grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--tint)_14%,transparent)] text-[var(--tint)] ring-1 ring-inset ring-white/40 backdrop-blur-sm shadow-[0_8px_16px_-4px_rgba(23,21,15,0.22),inset_0_1px_0_rgba(255,255,255,0.7)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105 sm:mx-0 sm:size-12 sm:rounded-2xl dark:bg-[color-mix(in_srgb,var(--tint)_26%,transparent)] dark:text-[color-mix(in_srgb,var(--tint)_55%,white)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:ring-white/10"
              >
                <p.icon className="size-[1.1rem] sm:size-6" strokeWidth={1.8} />
              </span>

              <h3 className="font-display mt-3 hyphens-auto text-[0.7rem] leading-tight tracking-[-0.01em] sm:mt-6 sm:text-2xl sm:tracking-[-0.02em]">{p.title}</h3>
              {/* the blurb is unreadable in a ~6rem column — keep it for sm and up */}
              {/* On glass the blurb sits over a colour wash, where `muted` goes
                  soft — it takes the stronger ink instead. */}
              <p className="hidden text-pretty leading-relaxed text-ink-soft sm:mt-3 sm:block sm:text-base">{p.desc}</p>

              {/* thin brand rule that grows on hover */}
              <span
                aria-hidden
                /* the rule is the card's one piece of pure colour — a dark
                   ground needs it lighter to read as the same accent */
                className="mx-auto mt-3 block h-0.5 w-5 rounded-full bg-[var(--tint)] transition-all duration-500 group-hover:w-16 sm:mx-0 sm:mt-6 sm:w-10 dark:bg-[color-mix(in_srgb,var(--tint)_60%,white)]"
              />
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/book?problem=installation"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Book an installation
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
