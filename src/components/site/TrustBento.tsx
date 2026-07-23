"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, Package, Headset, BadgeCheck, Wrench } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";
const INK = "#17150f";

/** One shell for every non-hero tile, so the bento reads as a single system. */
const SHELL =
  "border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)]";

function Chip({ icon: Icon, tint }: { icon: typeof ShieldCheck; tint: string }) {
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-500 group-hover:-translate-y-0.5"
      style={{ background: `${tint}16`, color: tint }}
    >
      <Icon className="size-5" strokeWidth={1.7} />
    </span>
  );
}

/** Soft corner wash in the tile's accent — depth without another border. */
function Glow({ tint }: { tint: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-[0.12] blur-3xl transition-opacity duration-500 group-hover:opacity-25"
      style={{ background: tint }}
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-2">
      {children}
    </span>
  );
}

function Rule({ tint }: { tint: string }) {
  return (
    <span
      aria-hidden
      className="mt-5 block h-0.5 w-8 rounded-full transition-all duration-500 group-hover:w-14"
      style={{ background: tint }}
    />
  );
}

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
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Why 24X7</Kicker>
          <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Trust, engineered
            <br />
            into every visit.
          </h2>
        </div>

        <div className="mt-10 sm:mt-14 grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-4 lg:grid-cols-4">
          {/* A — hero warranty (dark royal) */}
          <Card i={0} className="col-span-2 row-span-2 bg-royal p-7 text-white shadow-[0_32px_60px_-24px_rgba(37,71,208,0.55),inset_0_1.5px_0_rgba(255,255,255,0.15)] sm:p-9 lg:row-span-2">
            {/* technician at work behind a royal scrim — keeps the tile human without
                costing any contrast on the copy */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/ac-hero.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full object-cover object-[70%_center] opacity-45 mix-blend-luminosity transition-transform duration-[1.2s] group-hover:scale-105"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(37,71,208,0.86) 0%, rgba(37,71,208,0.7) 42%, rgba(20,34,105,0.92) 100%)",
              }}
            />
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
          <Card i={1} className={cn(SHELL, "col-span-2 p-7 sm:p-8")}>
            <Glow tint={ROYAL} />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <Chip icon={BadgeCheck} tint={EMERALD} />
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
              <div className="mt-6">
                <Eyebrow>On the ground</Eyebrow>
                <p className="font-display mt-2 text-4xl tracking-tight">12,000+</p>
                <p className="mt-1.5 text-[0.92rem] text-muted">Police-verified, brand-certified technicians.</p>
                <Rule tint={EMERALD} />
              </div>
            </div>
          </Card>

          {/* C — genuine parts */}
          <Card i={2} className={cn(SHELL, "p-7")}>
            <Glow tint={EMERALD} />
            <div className="relative flex h-full flex-col justify-between">
              <Chip icon={Package} tint={EMERALD} />
              <div className="mt-6">
                <Eyebrow>Every repair</Eyebrow>
                <p className="mt-2 text-lg font-semibold tracking-tight">Genuine parts</p>
                <p className="mt-1.5 text-sm text-muted">Only brand-approved, traceable components.</p>
                <Rule tint={EMERALD} />
              </div>
            </div>
          </Card>

          {/* D — rating */}
          <Card i={3} className={cn(SHELL, "p-7")}>
            <Glow tint={AMBER} />
            <div className="relative flex h-full flex-col justify-between">
              <Chip icon={Star} tint={AMBER} />
              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <p className="font-display text-4xl leading-none tracking-tight">4.9</p>
                  <span className="mb-0.5 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3 fill-amber text-amber" />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">across 128k verified reviews</p>
                <Rule tint={AMBER} />
              </div>
            </div>
          </Card>

          {/* E — 24/7 support (live) */}
          <Card i={4} className={cn(SHELL, "col-span-2 p-7 sm:p-8")}>
            <Glow tint={INK} />
            <div className="relative flex h-full items-center gap-5 sm:gap-6">
              <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-background transition-transform duration-500 group-hover:-translate-y-0.5 sm:size-16">
                <Headset className="size-6 sm:size-7" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex size-4">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald/60" />
                  <span className="relative inline-flex size-4 rounded-full bg-emerald ring-2 ring-[var(--surface)]" />
                </span>
              </div>
              <div>
                <Eyebrow>Always on</Eyebrow>
                <p className="font-display mt-2 text-2xl tracking-tight sm:text-3xl">24 × 7 support</p>
                <p className="mt-1.5 text-[0.92rem] text-muted">Real humans — any appliance, any hour, any day of the year.</p>
              </div>
            </div>
          </Card>

          {/* F — same-day */}
          <Card i={5} className={cn(SHELL, "col-span-2 p-7 sm:p-8")}>
            <Glow tint={AMBER} />
            <div className="relative flex h-full items-center gap-5 sm:gap-6">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber/12 text-amber transition-transform duration-500 group-hover:-translate-y-0.5 sm:size-16">
                <Wrench className="size-6 sm:size-7" strokeWidth={1.5} />
              </div>
              <div>
                <Eyebrow>Book by 2 PM</Eyebrow>
                <p className="font-display mt-2 text-2xl tracking-tight sm:text-3xl">Same-day service</p>
                <p className="mt-1.5 text-[0.92rem] text-muted">A certified pro is at your door by evening.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
