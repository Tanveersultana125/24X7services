"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, Package, Headset, BadgeCheck, Wrench } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const cardIn = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const } }),
};

function Card({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      custom={i}
      variants={cardIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={cn("group relative overflow-hidden rounded-[1.75rem] transition-all duration-500 hover:-translate-y-1.5", className)}
    >
      {children}
    </motion.div>
  );
}

export function TrustBento() {
  return (
    <section className="relative py-14 sm:py-36">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Why 24X7</Kicker>
          <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Trust, engineered
            <br />
            into every visit.
          </h2>
        </div>

        <div className="mt-14 grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-4 lg:grid-cols-4">
          {/* A — hero warranty (dark royal) */}
          <Card i={0} className="col-span-2 row-span-2 bg-gradient-to-br from-royal-bright to-royal p-9 text-white shadow-[0_32px_60px_-24px_rgba(37,71,208,0.55),inset_0_1.5px_0_rgba(255,255,255,0.15)] lg:row-span-2">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-royal-bright/40 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <ShieldCheck className="size-8 text-white/90" strokeWidth={1.5} />
              <div>
                <div className="flex items-end gap-3">
                  <span className="font-display text-[4rem] leading-[0.8] tracking-tighter sm:text-[5.5rem]">90</span>
                  <span className="mb-3 text-lg text-white/80">day warranty</span>
                </div>
                <p className="mt-5 max-w-sm text-pretty text-white/85">
                  If it breaks again within 90 days, we fix it free. Everything we do is
                  backed in writing — parts, labour and peace of mind.
                </p>
              </div>
            </div>
          </Card>

          {/* B — verified technicians */}
          <Card i={1} className="col-span-2 border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)] p-8">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <BadgeCheck className="size-7 text-emerald" strokeWidth={1.6} />
                <div className="flex -space-x-3">
                  {["#2547d0", "#0b9a63", "#d9821b", "#334155"].map((c, i) => (
                    <span
                      key={i}
                      className="grid size-9 place-items-center rounded-full text-xs font-semibold text-white ring-2 ring-[var(--surface)]"
                      style={{ background: c }}
                    >
                      {["RK", "SM", "AP", "JD"][i]}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-display text-4xl tracking-tight">12,000+</p>
                <p className="mt-1 text-muted">Police-verified, brand-certified technicians on the ground.</p>
              </div>
            </div>
          </Card>

          {/* C — genuine parts (emerald) */}
          <Card i={2} className="border border-emerald/25 bg-gradient-to-b from-emerald/12 to-emerald/[0.04] p-7 shadow-[0_16px_36px_-18px_rgba(11,154,99,0.22)] hover:shadow-[0_30px_54px_-22px_rgba(11,154,99,0.3)]">
            <div className="flex h-full flex-col justify-between">
              <Package className="size-7 text-emerald" strokeWidth={1.6} />
              <div>
                <p className="text-lg font-semibold">Genuine parts</p>
                <p className="mt-1 text-sm text-muted">Only brand-approved, traceable components.</p>
              </div>
            </div>
          </Card>

          {/* D — rating */}
          <Card i={3} className="border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)] p-7">
            <div className="flex h-full flex-col justify-between">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber text-amber" />
                ))}
              </div>
              <div>
                <p className="font-display text-4xl tracking-tight">4.9</p>
                <p className="mt-1 text-sm text-muted">across 128k verified reviews</p>
              </div>
            </div>
          </Card>

          {/* E — 24/7 support (glass, live) */}
          <Card i={4} className="col-span-2 border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)] p-8">
            <div className="flex h-full items-center gap-6">
              <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-ink text-background">
                <Headset className="size-7" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex size-4">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald/60" />
                  <span className="relative inline-flex size-4 rounded-full bg-emerald ring-2 ring-[var(--surface)]" />
                </span>
              </div>
              <div>
                <p className="font-display text-3xl tracking-tight">24 × 7 support</p>
                <p className="mt-1 text-muted">Real humans — any appliance, any hour, any day of the year.</p>
              </div>
            </div>
          </Card>

          {/* F — same-day */}
          <Card i={5} className="col-span-2 border border-white/70 bg-gradient-to-br from-white to-surface-2 p-8 shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)]">
            <div className="flex h-full items-center gap-6">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber/12 text-amber">
                <Wrench className="size-7" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-3xl tracking-tight">Same-day service</p>
                <p className="mt-1 text-muted">Book by 2 PM and a certified pro is at your door by evening.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
