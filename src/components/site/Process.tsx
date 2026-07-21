"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScanSearch, CalendarClock, Navigation, ShieldCheck } from "lucide-react";
import { Kicker } from "./TextReveal";
import { MagneticButton } from "./MagneticButton";
import { ArrowUpRight } from "lucide-react";

const STEPS = [
  { n: "01", icon: ScanSearch, tint: "#2547d0", title: "Describe it, or let AI diagnose", body: "Snap a photo or pick the symptom. Our model predicts the fault and the exact part before anyone knocks on your door." },
  { n: "02", icon: CalendarClock, tint: "#0b9a63", title: "Choose a time that suits you", body: "Same-day and next-day windows down to the hour. No 9-to-5 blocks, no waiting around, no vague promises." },
  { n: "03", icon: Navigation, tint: "#d9821b", title: "Watch your expert arrive", body: "A certified, brand-authorised technician — police-verified — tracked live on the map with a real ETA." },
  { n: "04", icon: ShieldCheck, tint: "#2547d0", title: "Fixed, invoiced, warrantied", body: "Genuine parts, a transparent digital invoice, and a 90-day warranty registered automatically. Done." },
];

export function Process() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 65%", "end 65%"] });
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0.02, 1]);

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
        <ol ref={listRef} className="relative lg:col-span-7">
          {/* timeline track + scroll-driven progress fill */}
          <span className="absolute left-[27px] top-7 hidden h-[calc(100%-5.5rem)] w-0.5 rounded-full bg-border sm:block" />
          <motion.span
            aria-hidden
            style={{ scaleY: lineScaleY }}
            className="absolute left-[27px] top-7 hidden h-[calc(100%-5.5rem)] w-0.5 origin-top rounded-full bg-royal-bright sm:block"
          />
          {STEPS.map((s) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-35% 0px -35% 0px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex gap-6 pb-6 last:pb-0 sm:gap-8"
            >
              {/* colored icon node */}
              <div className="relative z-10 hidden sm:block">
                <div
                  className="grid size-14 place-items-center rounded-2xl text-white shadow-[0_12px_22px_-6px_rgba(23,21,15,0.35),inset_0_1.5px_0_rgba(255,255,255,0.4)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
                  style={{ background: `linear-gradient(145deg, ${s.tint}, ${s.tint}cc)` }}
                >
                  <s.icon className="size-6" strokeWidth={1.7} />
                </div>
              </div>

              {/* 3D card */}
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white to-surface p-6 shadow-[0_16px_36px_-18px_rgba(23,21,15,0.2),inset_0_1.5px_0_rgba(255,255,255,0.92),inset_0_-14px_26px_-20px_rgba(23,21,15,0.1)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_54px_-22px_rgba(23,21,15,0.3),inset_0_1.5px_0_rgba(255,255,255,0.95)] sm:p-7">
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-5 top-4 font-display text-5xl font-bold leading-none sm:text-6xl"
                  style={{ color: `${s.tint}18` }}
                >
                  {s.n}
                </span>
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent" />
                <h3 className="relative text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h3>
                <p className="relative mt-3 max-w-lg text-pretty leading-relaxed text-muted">{s.body}</p>
                {/* accent rule */}
                <span className="relative mt-5 block h-1 w-10 rounded-full transition-all duration-500 group-hover:w-16" style={{ background: s.tint }} />
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
