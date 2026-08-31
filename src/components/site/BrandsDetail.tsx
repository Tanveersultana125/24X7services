"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ShieldCheck, Wrench, ArrowUpRight, Check } from "lucide-react";
import { Kicker } from "./TextReveal";
import { BrandMark } from "@/components/ui/Icons";
import { useBrands } from "@/components/providers/BrandsProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { brandsFor, type CatalogueService } from "@/lib/catalogue-shared";
import type { AdminBrand } from "@/lib/brands-shared";

const COVERAGE: Record<string, { appliances: string[]; specialties: string[] }> = {
  samsung: { appliances: ["Refrigerator", "Washing Machine", "Microwave & Oven", "Air Conditioner"], specialties: ["Digital Inverter", "Twin Cooling", "SmartThings panels"] },
  lg: { appliances: ["Refrigerator", "Washing Machine", "Microwave & Oven", "Air Conditioner"], specialties: ["Direct Drive", "Linear Compressor", "InstaView"] },
  ifb: { appliances: ["Washing Machine", "Microwave & Oven", "Air Conditioner"], specialties: ["Front-load drums", "Aqua energie", "Built-in modular"] },
  bosch: { appliances: ["Refrigerator", "Washing Machine", "Microwave & Oven", "Air Conditioner"], specialties: ["EcoSilence motors", "VarioInverter", "German precision"] },
};

/** One accent each: three identical blue cards read as one long card. */
const WHY = [
  { icon: Package, tint: "#2547d0", title: "Genuine spare parts", desc: "Every component is brand-approved and traceable — never a local substitute that voids your warranty." },
  { icon: Wrench, tint: "#0b9a63", title: "Model-specific training", desc: "Technicians are certified on each brand's exact platforms, not just generic repair." },
  { icon: ShieldCheck, tint: "#d9821b", title: "Warranty-safe service", desc: "Authorised repairs keep your manufacturer warranty intact and add our own 90-day cover." },
];

/**
 * A company added in the panel has no hand-written coverage, so it takes the
 * services it was actually ticked on and lists no specialties — better an
 * honest short card than four invented bullet points.
 */
function coverageFor(b: AdminBrand, services: CatalogueService[]) {
  const hand = COVERAGE[b.id];
  if (hand) return hand;
  return {
    appliances: services.filter((s) => brandsFor(s).includes(b.id)).map((s) => s.name),
    specialties: [] as string[],
  };
}

export function BrandsDetail() {
  const brands = useBrands();
  const services = useServices();
  return (
    <>
      {/* Coverage per brand */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          <Kicker>Coverage</Kicker>
          <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            What we service, brand by brand.
          </h2>

          <div className="mt-10 sm:mt-14 grid gap-5 md:grid-cols-2">
            {brands.map((b, i) => {
              const c = coverageFor(b, services);
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  /* On a near-black page, surface-on-background is barely a
                     card at all. Lit from above with a rim to hold its edge —
                     the same treatment the rest of the site's cards get. */
                  className="group relative overflow-hidden rounded-[1.75rem] border border-card-edge bg-gradient-to-b from-card to-surface p-8 shadow-[0_18px_40px_-20px_rgba(23,21,15,0.18),inset_0_1.5px_0_var(--card-edge)] transition-all duration-500 hover:-translate-y-1 dark:border-white/[0.12] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-white/[0.2]"
                >
                  <span className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20 dark:opacity-[0.18] dark:group-hover:opacity-30" style={{ background: b.accent }} />
                  <div className="flex items-start justify-between">
                    {/* white plate so the mark keeps its official colours in both themes */}
                    <span className="grid h-12 min-w-[7rem] place-items-center rounded-xl bg-white px-4 ring-1 ring-black/5">
                      <BrandMark id={b.id} name={b.name} accent={b.accent} tone="brand" className="text-xl" />
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
                      <ShieldCheck className="size-3.5" /> Authorised
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-muted">{b.tagline}</p>

                  <div className="mt-6">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-2">Appliances</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {c.appliances.map((a) => (
                        /* the chips sat on the card with nothing but a hairline
                           to separate them — a recessed fill gives them a shape */
                        <span key={a} className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-medium">{a}</span>
                      ))}
                    </div>
                  </div>

                  {c.specialties.length > 0 && (
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
                  )}

                  {/* Its own page first, booking from there — someone looking
                      for their make wants to see what we do for it before
                      they are asked to book. */}
                  <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <Link
                      href={`/brands/${b.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-royal-bright"
                    >
                      {b.name} services <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                    <Link
                      href={`/book?brand=${b.id}`}
                      className="text-sm font-medium text-muted transition-colors hover:text-ink"
                    >
                      Book now
                    </Link>
                  </div>
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
            <h2 className="font-display mt-6 text-[2.4rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Authorised isn&apos;t a label. It&apos;s a standard.
            </h2>
          </div>
          <div className="mt-10 sm:mt-14 grid gap-6 lg:grid-cols-3">
            {WHY.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                /* bg-background made these the page with a hairline drawn on
                   it; they take the same lit card the rest of the site uses */
                style={{ "--tint": w.tint } as React.CSSProperties}
                className="group relative overflow-hidden rounded-[1.75rem] border border-card-edge bg-gradient-to-b from-card to-surface p-8 shadow-[0_18px_40px_-20px_rgba(23,21,15,0.18),inset_0_1.5px_0_var(--card-edge)] transition-all duration-500 hover:-translate-y-1 dark:border-white/[0.12] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-white/[0.2]"
              >
                {/* the card's own colour, sunk into the corner it comes from */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-14 -top-14 size-40 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-500 group-hover:opacity-25 dark:opacity-25 dark:group-hover:opacity-40"
                  style={{ background: "var(--tint)" }}
                />

                {/* a tint at 10% is a colour on paper and a smudge on black */}
                <div className="relative grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--tint)_12%,transparent)] text-[var(--tint)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--tint)_22%,transparent)] transition-transform duration-500 group-hover:scale-105 dark:bg-[color-mix(in_srgb,var(--tint)_24%,transparent)] dark:text-[color-mix(in_srgb,var(--tint)_55%,white)] dark:ring-white/10">
                  <w.icon className="size-6" strokeWidth={1.6} />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold tracking-tight">{w.title}</h3>
                <span
                  aria-hidden
                  className="relative mt-3 block h-0.5 w-8 rounded-full bg-[var(--tint)] transition-all duration-500 group-hover:w-14 dark:bg-[color-mix(in_srgb,var(--tint)_60%,white)]"
                />
                <p className="relative mt-3 text-sm leading-relaxed text-ink-soft">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
