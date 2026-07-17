"use client";

import { motion } from "framer-motion";
import { ScanSearch, CalendarClock, Navigation, ShieldCheck } from "lucide-react";
import { Kicker } from "./TextReveal";
import { MagneticButton } from "./MagneticButton";
import { ArrowUpRight } from "lucide-react";

const STEPS = [
  { n: "01", icon: ScanSearch, title: "Describe it, or let AI diagnose", body: "Snap a photo or pick the symptom. Our model predicts the fault and the exact part before anyone knocks on your door." },
  { n: "02", icon: CalendarClock, title: "Choose a time that suits you", body: "Same-day and next-day windows down to the hour. No 9-to-5 blocks, no waiting around, no vague promises." },
  { n: "03", icon: Navigation, title: "Watch your expert arrive", body: "A certified, brand-authorised technician — police-verified — tracked live on the map with a real ETA." },
  { n: "04", icon: ShieldCheck, title: "Fixed, invoiced, warrantied", body: "Genuine parts, a transparent digital invoice, and a 90-day warranty registered automatically. Done." },
];

export function Process() {
  return (
    <section id="process" className="relative scroll-mt-28 bg-surface py-28 sm:py-36">
      <div className="mx-auto grid max-w-[92rem] gap-16 px-6 sm:px-10 lg:grid-cols-12">
        {/* Sticky heading */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Kicker>The process</Kicker>
            <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              From broken
              <br />
              to brilliant,
              <br />
              <span className="italic text-royal-bright">in four moves.</span>
            </h2>
            <p className="mt-6 max-w-sm text-pretty text-muted">
              No call centres. No haggling. A booking experience engineered to feel as
              premium as the repair itself.
            </p>
            <div className="mt-10">
              <MagneticButton href="/book" tone="royal">
                Start now <ArrowUpRight className="size-4" />
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Steps */}
        <ol className="relative lg:col-span-7">
          <span className="absolute left-[27px] top-4 hidden h-[calc(100%-4rem)] w-px bg-border sm:block" />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex gap-6 pb-14 last:pb-0 sm:gap-10"
            >
              <div className="relative z-10 hidden sm:block">
                <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface shadow-premium-sm">
                  <s.icon className="size-6 text-royal-bright" strokeWidth={1.6} />
                </div>
              </div>
              <div className="flex-1 border-b border-hairline pb-14 last:border-0">
                <span className="font-display text-5xl text-border-strong sm:text-6xl">{s.n}</span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-3 max-w-lg text-pretty leading-relaxed text-muted">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
