"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { Kicker } from "./TextReveal";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";
import { cn } from "@/lib/utils";

const DETAIL: Record<string, { services: string[]; note: string }> = {
  samsung: { services: ["Refrigerator", "Washing Machine", "Microwave", "Oven"], note: "Digital Inverter & Twin Cooling specialists" },
  lg: { services: ["Refrigerator", "Washing Machine", "Microwave", "Oven"], note: "Direct Drive & Linear Compressor certified" },
  ifb: { services: ["Washing Machine", "Microwave", "Oven"], note: "Front-load & built-in modular experts" },
  bosch: { services: ["Refrigerator", "Washing Machine", "Oven"], note: "German-engineered precision servicing" },
};

export function BrandShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section id="brands" className="relative scroll-mt-28 py-28 sm:py-36">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Authorised partners</Kicker>
          <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            The brands you own,
            <br />
            the experts they trust.
          </h2>
        </div>

        {/* Desktop: expanding panels */}
        <div className="mt-14 hidden gap-3 lg:flex" style={{ height: "26rem" }}>
          {BRANDS.map((b, i) => {
            const open = active === i;
            const d = DETAIL[b.id];
            return (
              <motion.div
                key={b.id}
                onMouseEnter={() => setActive(i)}
                animate={{ flex: open ? 3.2 : 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-[1.75rem] border transition-colors",
                  open ? "border-transparent text-white" : "border-border bg-surface"
                )}
                style={open ? { background: `linear-gradient(150deg, ${b.accent}, ${shade(b.accent)})` } : undefined}
              >
                {/* collapsed label */}
                {!open && (
                  <div className="absolute inset-0 flex flex-col items-center justify-between py-8">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{`0${i + 1}`}</span>
                    <span className="[writing-mode:vertical-rl] rotate-180">
                      <BrandMark id={b.id} className="text-lg" />
                    </span>
                    <BadgeCheck className="size-5 text-emerald" />
                  </div>
                )}

                {/* expanded content */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="absolute inset-0 flex flex-col justify-between p-9"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">{`0${i + 1} — Authorised`}</span>
                        <BadgeCheck className="size-6 text-white" />
                      </div>

                      <div>
                        <span className="text-white [&_*]:text-white">
                          <BrandMark id={b.id} className="text-4xl" />
                        </span>
                        <p className="mt-3 max-w-sm text-white/85">{d.note}</p>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {d.services.map((s) => (
                            <span key={s} className="rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur">
                              {s}
                            </span>
                          ))}
                        </div>

                        <Link
                          href={`/book?brand=${b.id}`}
                          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
                        >
                          Book {b.name} service
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: stacked cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
          {BRANDS.map((b, i) => (
            <Link
              key={b.id}
              href={`/book?brand=${b.id}`}
              className="relative overflow-hidden rounded-3xl p-7 text-white"
              style={{ background: `linear-gradient(150deg, ${b.accent}, ${shade(b.accent)})` }}
            >
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">{`0${i + 1}`}</span>
              <div className="mt-8 [&_*]:text-white">
                <BrandMark id={b.id} className="text-3xl" />
              </div>
              <p className="mt-2 text-sm text-white/80">{DETAIL[b.id].note}</p>
              <ArrowUpRight className="absolute right-6 top-6 size-5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Darken a hex for gradient depth. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `rgb(${r},${g},${b})`;
}
