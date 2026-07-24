"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Kicker } from "./TextReveal";

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
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:mt-12 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-border pl-4 sm:pl-6"
            >
              <div className="font-display flex items-baseline text-[2.5rem] leading-none tracking-tighter sm:text-[4.5rem]">
                <Counter to={s.to} decimals={s.decimals} />
                <span className="text-royal-bright">{s.suffix}</span>
              </div>
              <p className="mt-3 text-[0.95rem] font-medium sm:mt-5 sm:text-lg">{s.label}</p>
              <p className="text-[0.8rem] text-muted sm:text-sm">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
