"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ShieldCheck, Wrench, ArrowUpRight, Check } from "lucide-react";
import { Kicker } from "./TextReveal";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";

const COVERAGE: Record<string, { appliances: string[]; specialties: string[] }> = {
  samsung: { appliances: ["Refrigerator", "Washing Machine", "Microwave", "Oven"], specialties: ["Digital Inverter", "Twin Cooling", "SmartThings panels"] },
  lg: { appliances: ["Refrigerator", "Washing Machine", "Microwave", "Oven"], specialties: ["Direct Drive", "Linear Compressor", "InstaView"] },
  ifb: { appliances: ["Washing Machine", "Microwave", "Oven"], specialties: ["Front-load drums", "Aqua energie", "Built-in modular"] },
  bosch: { appliances: ["Refrigerator", "Washing Machine", "Oven"], specialties: ["EcoSilence motors", "VarioInverter", "German precision"] },
};

const WHY = [
  { icon: Package, title: "Genuine spare parts", desc: "Every component is brand-approved and traceable — never a local substitute that voids your warranty." },
  { icon: Wrench, title: "Model-specific training", desc: "Technicians are certified on each brand's exact platforms, not just generic repair." },
  { icon: ShieldCheck, title: "Warranty-safe service", desc: "Authorised repairs keep your manufacturer warranty intact and add our own 90-day cover." },
];

export function BrandsDetail() {
  return (
    <>
      {/* Coverage per brand */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          <Kicker>Coverage</Kicker>
          <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            What we service, brand by brand.
          </h2>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {BRANDS.map((b, i) => {
              const c = COVERAGE[b.id];
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-8"
                >
                  <span className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20" style={{ background: b.accent }} />
                  <div className="flex items-start justify-between">
                    <BrandMark id={b.id} tone="brand" className="text-2xl" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
                      <ShieldCheck className="size-3.5" /> Authorised
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted">{b.tagline}</p>

                  <div className="mt-6">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-2">Appliances</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {c.appliances.map((a) => (
                        <span key={a} className="rounded-full border border-border px-3 py-1 text-xs font-medium">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-2">Specialties</p>
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {c.specialties.map((s) => (
                        <li key={s} className="flex items-center gap-2 text-sm text-ink-soft">
                          <Check className="size-4 text-emerald" strokeWidth={2.5} /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/book?brand=${b.id}`}
                    className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-royal-bright"
                  >
                    Book {b.name} service <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why authorised */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          <div className="max-w-2xl">
            <Kicker>Why it matters</Kicker>
            <h2 className="font-display mt-6 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Authorised isn&apos;t a label. It&apos;s a standard.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {WHY.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="rounded-[1.75rem] border border-border bg-background p-8"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-royal/10 text-royal-bright">
                  <w.icon className="size-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
