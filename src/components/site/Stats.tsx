"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const STATS = [
  { to: 3.2, decimals: 1, prefix: "", suffix: "M", label: "Services completed", sub: "since 2019" },
  { to: 12, decimals: 0, prefix: "", suffix: "k+", label: "Certified technicians", sub: "police-verified" },
  { to: 4.9, decimals: 1, prefix: "", suffix: "★", label: "Average rating", sub: "128k reviews" },
  { to: 33, decimals: 0, prefix: "", suffix: "", label: "Telangana districts", sub: "fully covered" },
];

export function Stats() {
  return (
    <section className="relative border-y border-hairline py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>By the numbers</Kicker>

        {/* Mobile: one auto-rotating stat */}
        <RotatingStat />

        {/* Tablet & desktop: full grid */}
        <div className="mt-12 hidden gap-x-8 gap-y-14 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-border pl-6"
            >
              <div className="font-display flex items-baseline text-[3.5rem] leading-none tracking-tighter sm:text-[4.5rem]">
                <Counter to={s.to} decimals={s.decimals} />
                <span className="text-royal-bright">{s.suffix}</span>
              </div>
              <p className="mt-5 text-lg font-medium">{s.label}</p>
              <p className="text-sm text-muted">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RotatingStat() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % STATS.length), 2800);
    return () => clearInterval(t);
  }, [paused]);

  const s = STATS[index];

  return (
    <div className="mt-8 sm:hidden">
      <div className="relative flex min-h-[12rem] items-center overflow-hidden rounded-3xl border border-border bg-surface px-7 shadow-premium-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-display flex items-baseline text-[3.75rem] leading-none tracking-tighter">
              <MountCounter to={s.to} decimals={s.decimals} />
              <span className="text-royal-bright">{s.suffix}</span>
            </div>
            <p className="mt-4 text-lg font-medium">{s.label}</p>
            <p className="text-sm text-muted">{s.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* dots */}
      <div className="mt-5 flex justify-center gap-2">
        {STATS.map((st, i) => (
          <button
            key={st.label}
            onClick={() => {
              setIndex(i);
              setPaused(true);
            }}
            aria-label={`Show ${st.label}`}
            aria-current={i === index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-royal-bright" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Counts up once when scrolled into view (used by the desktop grid). */
function Counter({ to, decimals }: { to: number; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{val.toFixed(decimals)}</span>;
}

/** Counts up every time it mounts — remounted on each rotation via its key. */
function MountCounter({ to, decimals }: { to: number; decimals: number }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [to]);

  return <span>{val.toFixed(decimals)}</span>;
}
