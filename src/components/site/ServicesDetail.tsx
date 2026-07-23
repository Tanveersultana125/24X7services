"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Package, ClipboardCheck, Sparkles, Receipt, Timer, Clock,
  Headset, ThumbsUp, ChevronRight, Wrench, Tag, Snowflake, Droplets, Fuel, DoorOpen,
  Cog, Volume2, Flame, Zap, Thermometer, Fan, RotateCw, MonitorSmartphone, Power,
  Lock, Disc3, Cpu, PackageOpen,
} from "lucide-react";
import { ApplianceTile } from "@/components/ui/Icons";
import { APPLIANCES } from "@/lib/data";
import { formatRange } from "@/lib/utils";
import type { ApplianceId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";
const VIOLET = "#6d5ae0";

const INCLUDES = [
  { icon: ClipboardCheck, tint: ROYAL, title: "Free diagnosis", desc: "A full inspection and honest assessment before any charge." },
  { icon: Package, tint: EMERALD, title: "Genuine parts", desc: "Only brand-approved, traceable spares — never local substitutes." },
  { icon: ShieldCheck, tint: ROYAL, title: "90-day warranty", desc: "Every repair and part covered in writing for 90 days." },
  { icon: Sparkles, tint: AMBER, title: "Clean finish", desc: "The technician tidies up and tests the appliance with you." },
  { icon: Receipt, tint: ROYAL, title: "Digital invoice", desc: "A transparent, itemised GST invoice sent instantly." },
  { icon: Timer, tint: EMERALD, title: "On-time promise", desc: "Live ETA tracking and a slot you actually choose." },
];

/** Each fault gets its own glyph — a repeated wrench made every row look identical. */
const PROBLEM_ICONS: Record<string, typeof Wrench> = {
  "not-cooling": Snowflake,
  "water-leakage": Droplets,
  "gas-filling": Fuel,
  "door-issue": DoorOpen,
  "door-lock": Lock,
  compressor: Cog,
  "ice-build-up": Snowflake,
  noise: Volume2,
  installation: Wrench,
  "drum-issue": Disc3,
  "spin-issue": RotateCw,
  "motor-problem": Cog,
  "not-starting": Power,
  "power-problem": Zap,
  "display-issue": MonitorSmartphone,
  "display-problem": MonitorSmartphone,
  "heating-issue": Flame,
  "not-heating": Flame,
  "plate-not-rotating": RotateCw,
  spark: Zap,
  thermostat: Thermometer,
  "fan-issue": Fan,
  "deep-clean": Sparkles,
  "pcb-issue": Cpu,
  uninstallation: PackageOpen,
};

/** A shot of the actual unit, shown beside the appliance name. */
const APPLIANCE_UNIT: Record<string, { src: string; fit: "cover" | "contain"; pos?: string }> = {
  refrigerator: { src: "/work/unit-refrigerator.png", fit: "contain" },
  "washing-machine": { src: "/work/unit-washing-machine.png", fit: "cover", pos: "center 40%" },
  microwave: { src: "/work/unit-oven.png", fit: "cover", pos: "38% center" },
  ac: { src: "/work/unit-ac.png", fit: "cover" },
};

const PRICING_PROOF = [
  { icon: ShieldCheck, tint: ROYAL, title: "Certified Professionals", desc: "Skilled & verified experts" },
  { icon: Tag, tint: VIOLET, title: "Transparent Pricing", desc: "No hidden charges, ever" },
];

const PRICING_ASSURANCES = [
  { icon: ShieldCheck, tint: ROYAL, title: "90-Day Warranty", desc: "On all repairs & parts" },
  { icon: Tag, tint: EMERALD, title: "Upfront Pricing", desc: "You approve before we start" },
  { icon: Headset, tint: AMBER, title: "Quick Support", desc: "We're here when you need us" },
  { icon: ThumbsUp, tint: ROYAL, title: "Satisfaction Guaranteed", desc: "Quality service, always" },
];

export function ServicesDetail() {
  const [active, setActive] = useState<ApplianceId>("refrigerator");
  const appliance = APPLIANCES.find((a) => a.id === active)!;

  return (
    <>
      {/* What's included */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        {/* soft field behind the intro, echoing the promise mark on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 hidden size-[34rem] rounded-full opacity-70 blur-3xl lg:block"
          style={{ background: "radial-gradient(circle, rgba(37,71,208,0.14), transparent 65%)" }}
        />

        <div className="relative mx-auto max-w-[92rem] px-6 sm:px-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-royal-bright">
                Our promise
                <ShieldCheck className="size-4" strokeWidth={2.2} />
              </span>

              <h2 className="font-display mt-4 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                What&apos;s included in <span className="italic text-royal-bright">every</span> service.
              </h2>

              <span aria-hidden className="mt-5 block h-1 w-14 rounded-full bg-royal-bright" />

              <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                We believe in complete transparency and providing the best experience at every step.
              </p>
            </div>

            {/* promise mark — background keyed out, so it sits straight on the page */}
            <div aria-hidden className="relative w-full max-w-sm shrink-0 lg:w-[24rem]">
              <span
                className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(37,71,208,0.10), transparent 68%)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/work/promise-shield-cut.png" alt="" className="w-full" />
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[1.5rem] border border-white/70 bg-gradient-to-b from-white to-surface p-6 shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)] sm:p-7"
              >
                <span
                  className="grid size-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:-translate-y-0.5"
                  style={{ background: `${f.tint}16`, color: f.tint }}
                >
                  <f.icon className="size-6" strokeWidth={1.7} />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{f.desc}</p>
                <span
                  aria-hidden
                  className="mt-5 block h-0.5 w-8 rounded-full transition-all duration-500 group-hover:w-14"
                  style={{ background: f.tint }}
                />
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Problems & pricing */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          {/* ---------- intro panel ---------- */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-white to-[#f1f3fc] px-6 py-8 shadow-premium-md sm:rounded-[2rem] sm:px-10 sm:py-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(37,71,208,0.14), transparent 64%)" }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.95fr_0.72fr] lg:items-center lg:gap-8">
              <div>
                <span className="inline-flex items-center gap-2.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-royal-bright">
                  <span aria-hidden className="h-0.5 w-6 rounded-full bg-royal-bright" />
                  Transparent pricing
                </span>

                <h2 className="font-display mt-4 text-[2.2rem] leading-[1.05] tracking-[-0.03em] sm:text-[3.2rem]">
                  Faults we fix —
                  <br />
                  and what they <span className="italic text-royal-bright">cost.</span>
                </h2>

                <span aria-hidden className="mt-5 block h-1 w-14 rounded-full bg-royal-bright" />

                <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                  Real price bands for real problems. You&apos;ll always see an exact estimate
                  before you confirm.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
                  {PRICING_PROOF.map((p, i) => (
                    <div key={p.title} className="flex items-center gap-3">
                      {i > 0 && <span aria-hidden className="mr-5 hidden h-10 w-px bg-hairline sm:block" />}
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-xl"
                        style={{ background: `${p.tint}16`, color: p.tint }}
                      >
                        <p.icon className="size-5" strokeWidth={1.8} />
                      </span>
                      <span className="leading-none">
                        <span className="block text-[0.88rem] font-semibold tracking-tight">{p.title}</span>
                        <span className="mt-1.5 block text-[0.76rem] text-muted">{p.desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* the range we service, on its plinth */}
              <div aria-hidden className="relative mx-auto w-full max-w-sm lg:max-w-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/work/appliance-lineup.png" alt="" className="w-full" />
              </div>

              {/* promise note */}
              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-premium-md">
                  <span className="grid size-11 place-items-center rounded-xl bg-royal-bright/10 text-royal-bright">
                    <Receipt className="size-5" strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight">
                    Real price bands for real problems.
                  </p>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
                    You&apos;ll always see an exact estimate before you confirm.
                  </p>
                  <svg
                    aria-hidden
                    viewBox="0 0 300 60"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-royal-bright/10"
                  >
                    <path d="M0 34c48-26 96 22 150 6s102-30 150-4v24H0z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- appliance tabs ---------- */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {APPLIANCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  active === a.id
                    ? "border-transparent bg-royal-bright text-white shadow-[0_14px_30px_-12px_rgba(37,71,208,0.6)]"
                    : "border-white/70 bg-white text-ink shadow-premium-sm hover:-translate-y-0.5"
                )}
              >
                <ApplianceTile id={a.id} size="sm" />
                {a.name}
              </button>
            ))}
          </div>

          {/* ---------- price list ---------- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-4 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-premium-md"
            >
              <div className="relative flex min-h-[7.5rem] items-center gap-4 overflow-hidden border-b border-hairline p-6 sm:min-h-[9.5rem]">
                <ApplianceTile id={appliance.id} size="lg" />
                <div className="relative">
                  <h3 className="font-display text-2xl tracking-tight">{appliance.name}</h3>
                  <p className="text-sm text-muted">{appliance.blurb}</p>
                </div>
                {/* the unit itself, bleeding in from the right of the header band */}
                {APPLIANCE_UNIT[appliance.id] && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 sm:block lg:w-2/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={APPLIANCE_UNIT[appliance.id].src}
                      alt=""
                      className={cn(
                        "size-full object-contain object-right",
                        APPLIANCE_UNIT[appliance.id].fit === "contain" ? "p-3" : ""
                      )}
                    />
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.88) 22%, rgba(255,255,255,0.25) 52%, rgba(255,255,255,0) 78%)",
                      }}
                    />
                  </span>
                )}
              </div>

              <ul className="divide-y divide-hairline">
                {appliance.problems.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/book?appliance=${appliance.id}&problem=${p.id}`}
                      className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-2/40 sm:gap-4 sm:px-6"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-royal-bright/10 text-royal-bright">
                        {(() => {
                          const Glyph = PROBLEM_ICONS[p.id] ?? Wrench;
                          return <Glyph className="size-4" strokeWidth={1.9} />;
                        })()}
                      </span>

                      <span className="min-w-0 flex-1 font-medium">
                        {p.label}
                        {p.common && (
                          <span className="ml-2 rounded-full bg-royal-bright/12 px-2 py-0.5 align-middle text-[10px] font-bold tracking-wider text-royal-bright">
                            POPULAR
                          </span>
                        )}
                      </span>

                      <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
                        <Clock className="size-3.5 text-royal-bright" /> {p.eta}
                      </span>

                      <span className="w-28 text-right text-sm font-bold tracking-tight sm:w-40 sm:text-base">
                        {formatRange(p.price[0], p.price[1])}
                      </span>

                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted transition-all group-hover:border-royal-bright group-hover:bg-royal-bright group-hover:text-white">
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* ---------- pricing assurances ---------- */}
          <div className="mt-4 grid grid-cols-1 gap-6 rounded-[1.75rem] border border-white/70 bg-white px-5 py-6 shadow-premium-sm sm:grid-cols-2 sm:px-7 lg:grid-cols-4 lg:divide-x lg:divide-hairline">
            {PRICING_ASSURANCES.map((a) => (
              <div key={a.title} className="flex items-center gap-3.5 lg:justify-center lg:px-4">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full"
                  style={{ background: `${a.tint}16`, color: a.tint }}
                >
                  <a.icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block text-[0.88rem] font-semibold tracking-tight">{a.title}</span>
                  <span className="mt-1.5 block text-[0.75rem] leading-snug text-muted">{a.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
