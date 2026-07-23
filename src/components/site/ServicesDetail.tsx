"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Package, ClipboardCheck, Sparkles, Receipt, Timer, ArrowUpRight, Clock,
} from "lucide-react";
import { Kicker } from "./TextReveal";
import { ApplianceTile } from "@/components/ui/Icons";
import { APPLIANCES } from "@/lib/data";
import { formatRange } from "@/lib/utils";
import type { ApplianceId } from "@/lib/types";
import { cn } from "@/lib/utils";

const INCLUDES = [
  { icon: ClipboardCheck, title: "Free diagnosis", desc: "A full inspection and honest assessment before any charge." },
  { icon: Package, title: "Genuine parts", desc: "Only brand-approved, traceable spares — never local substitutes." },
  { icon: ShieldCheck, title: "90-day warranty", desc: "Every repair and part covered in writing for 90 days." },
  { icon: Sparkles, title: "Clean finish", desc: "The technician tidies up and tests the appliance with you." },
  { icon: Receipt, title: "Digital invoice", desc: "A transparent, itemised GST invoice sent instantly." },
  { icon: Timer, title: "On-time promise", desc: "Live ETA tracking and a slot you actually choose." },
];

export function ServicesDetail() {
  const [active, setActive] = useState<ApplianceId>("refrigerator");
  const appliance = APPLIANCES.find((a) => a.id === active)!;

  return (
    <>
      {/* What's included */}
      <section className="py-14 sm:py-28">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          <Kicker>Every visit, guaranteed</Kicker>
          <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            What&apos;s included in <span className="italic text-royal-bright">every</span> service.
          </h2>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-surface p-8 transition-colors hover:bg-surface-2/50"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-royal-bright/10 text-royal-bright transition-colors group-hover:bg-royal-bright group-hover:text-white">
                  <f.icon className="size-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems & pricing */}
      <section className="bg-surface py-14 sm:py-28">
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
