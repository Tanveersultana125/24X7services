"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Package, ClipboardCheck, Sparkles, Receipt, Timer, ArrowUpRight, Clock,
  BadgeCheck, Headset, Lock, ThumbsUp,
} from "lucide-react";
import { Kicker } from "./TextReveal";
import { ApplianceTile } from "@/components/ui/Icons";
import { APPLIANCES } from "@/lib/data";
import { formatRange } from "@/lib/utils";
import type { ApplianceId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";

const INCLUDES = [
  { icon: ClipboardCheck, tint: ROYAL, title: "Free diagnosis", desc: "A full inspection and honest assessment before any charge." },
  { icon: Package, tint: EMERALD, title: "Genuine parts", desc: "Only brand-approved, traceable spares — never local substitutes." },
  { icon: ShieldCheck, tint: ROYAL, title: "90-day warranty", desc: "Every repair and part covered in writing for 90 days." },
  { icon: Sparkles, tint: AMBER, title: "Clean finish", desc: "The technician tidies up and tests the appliance with you." },
  { icon: Receipt, tint: ROYAL, title: "Digital invoice", desc: "A transparent, itemised GST invoice sent instantly." },
  { icon: Timer, tint: EMERALD, title: "On-time promise", desc: "Live ETA tracking and a slot you actually choose." },
];

const ASSURANCES = [
  { icon: BadgeCheck, title: "Trusted & Verified", desc: "Background-checked professionals" },
  { icon: Headset, title: "24 × 7 Support", desc: "Real humans. Always." },
  { icon: Lock, title: "Secure & Safe", desc: "Your safety is our priority" },
  { icon: ThumbsUp, title: "100% Satisfaction", desc: "We're not happy till you are" },
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

          {/* assurance strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 grid grid-cols-1 gap-6 rounded-[1.5rem] border border-white/70 bg-gradient-to-b from-white to-surface px-6 py-6 shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:divide-x lg:divide-hairline"
          >
            {ASSURANCES.map((a) => (
              <div key={a.title} className="flex items-center gap-3.5 lg:justify-center lg:px-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-royal-bright/10 text-royal-bright">
                  <a.icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block text-[0.88rem] font-semibold tracking-tight text-royal-bright">{a.title}</span>
                  <span className="mt-1.5 block text-[0.75rem] text-muted">{a.desc}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problems & pricing */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Kicker>Transparent pricing</Kicker>
              <h2 className="font-display mt-6 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Faults we fix — and
                <br />
                what they cost.
              </h2>
            </div>
            <p className="max-w-xs text-pretty text-muted md:text-right">
              Real price bands for real problems. You&apos;ll always see an exact estimate before you confirm.
            </p>
          </div>

          {/* appliance tabs */}
          <div className="mt-12 flex flex-wrap gap-2.5">
            {APPLIANCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  active === a.id
                    ? "border-transparent bg-ink text-background"
                    : "border-border bg-background text-muted hover:border-border-strong hover:text-ink"
                )}
              >
                <ApplianceTile id={a.id} size="sm" />
                {a.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-10 overflow-hidden rounded-[1.75rem] border border-border bg-background"
            >
              <div className="flex items-center gap-4 border-b border-hairline p-6">
                <ApplianceTile id={appliance.id} size="lg" />
                <div>
                  <h3 className="font-display text-2xl tracking-tight">{appliance.name}</h3>
                  <p className="text-sm text-muted">{appliance.blurb}</p>
                </div>
              </div>
              <ul className="divide-y divide-hairline">
                {appliance.problems.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/book?appliance=${appliance.id}&problem=${p.id}`}
                      className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-2/40"
                    >
                      <span className="flex-1 font-medium">
                        {p.label}
                        {p.common && (
                          <span className="ml-2 rounded-full bg-amber/15 px-1.5 py-0.5 text-[10px] font-bold text-amber align-middle">POPULAR</span>
                        )}
                      </span>
                      <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
                        <Clock className="size-3.5" /> {p.eta}
                      </span>
                      <span className="w-32 text-right text-sm font-semibold sm:w-40">{formatRange(p.price[0], p.price[1])}</span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-2 transition-all group-hover:translate-x-0.5 group-hover:text-royal-bright" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
