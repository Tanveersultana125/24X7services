"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { Kicker } from "./TextReveal";

const STATS = [
  { to: 3.2, decimals: 1, prefix: "", suffix: "M", label: "Services completed", sub: "since 2019", color: "#2547d0" },
  { to: 12, decimals: 0, prefix: "", suffix: "k+", label: "Certified technicians", sub: "police-verified", color: "#0b9a63" },
  { to: 4.9, decimals: 1, prefix: "", suffix: "★", label: "Average rating", sub: "128k reviews", color: "#d9821b" },
  { to: 33, decimals: 0, prefix: "", suffix: "", label: "Telangana districts", sub: "fully covered", color: "#7c3aed" },
];

function rgba(hex: string, a: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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

/** How long a tap on a dot holds the carousel before it resumes on its own. */
const RESUME_AFTER = 6000;

function RotatingStat() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped on every tap so a second tap restarts the resume timer, which a
  // boolean alone can't do — the effect wouldn't re-run while already paused.
  const [pauseNonce, setPauseNonce] = useState(0);

  // Only advance while the section is actually on screen.
  useEffect(() => {
    if (paused || !inView) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % STATS.length), 2800);
    return () => clearInterval(t);
  }, [paused, inView]);

  // A tap pauses the rotation; it always starts itself again afterwards.
  useEffect(() => {
    if (!paused) return;
    const t = setTimeout(() => setPaused(false), RESUME_AFTER);
    return () => clearTimeout(t);
  }, [paused, pauseNonce]);

  const show = (i: number) => {
    setIndex(i);
    setPaused(true);
    setPauseNonce((n) => n + 1);
  };

  const step = (dir: 1 | -1) => show((index + dir + STATS.length) % STATS.length);

  /**
   * Swipe support. This card isn't a scroll container, so a finger drag did
   * nothing — the gesture has to be read by hand.
   */
  const swipe = useRef({ x: 0, y: 0, active: false });

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY, active: true };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!swipe.current.active) return;
    swipe.current.active = false;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    // a mostly-vertical drag is the page scrolling, not a swipe
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  };

  const s = STATS[index];

  return (
    <div ref={ref} className="mt-8 sm:hidden">
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current.active = false)}
        /* touch-pan-y keeps vertical page scrolling working while we read
           horizontal drags ourselves */
        className="relative flex min-h-[11rem] touch-pan-y select-none items-center overflow-hidden rounded-3xl border border-border bg-surface pl-8 pr-7 shadow-premium-md transition-colors duration-700"
        style={{ borderColor: rgba(s.color, 0.28) }}
      >
        {/* left accent bar — always the current stat's colour */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5 transition-colors duration-700"
          style={{ background: s.color }}
        />
        {/* soft colour glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl transition-colors duration-700"
          style={{ background: rgba(s.color, 0.22) }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div
              className="font-display flex items-baseline text-[3.75rem] font-semibold leading-none tracking-tighter"
              style={{ color: s.color }}
            >
              <MountCounter to={s.to} decimals={s.decimals} />
              <span>{s.suffix}</span>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">{s.label}</p>
            <p className="text-sm text-muted">{s.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* dots */}
      <div className="mt-5 flex justify-center gap-2">
        {STATS.map((st, i) => (
          <button
            key={st.label}
            type="button"
            onClick={() => show(i)}
            aria-label={`Show ${st.label}`}
            aria-current={i === index}
            /* generous hit area around a 6px dot, without changing how it looks */
            className="relative h-1.5 rounded-full transition-all duration-300 before:absolute before:-inset-x-1 before:-inset-y-3 before:content-['']"
            style={{
              width: i === index ? "1.5rem" : "0.375rem",
              background: i === index ? st.color : "var(--border)",
            }}
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
