"use client";

import { motion } from "framer-motion";
import { Check, ArrowUpRight, Sparkles } from "lucide-react";
import { Kicker } from "./TextReveal";
import { AMC_PLANS } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export function Plans() {
  const premium = AMC_PLANS.find((p) => p.highlight)!;
  const rest = AMC_PLANS.filter((p) => !p.highlight);

  return (
    <section id="plans" className="relative scroll-mt-28 bg-surface py-28 sm:py-36">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>Membership</Kicker>
            <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Care that pays
              <br />
              for itself.
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-muted md:text-right">
            One annual plan keeps every appliance in the home running — preventive visits,
            priority dispatch and genuine parts.
          </p>
        </div>

        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-14 overflow-hidden rounded-[2rem] bg-royal p-9 text-white sm:p-12"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-royal-bright/40 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles className="size-3.5" /> Most chosen
              </span>
              <h3 className="font-display mt-6 text-4xl tracking-tight">{premium.name}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-display text-6xl tracking-tighter">{formatINR(premium.price)}</span>
                <span className="mb-2 text-white/70">{premium.period}</span>
              </div>
              <a
                href={`/book?amc=${premium.id}`}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-royal transition-transform hover:scale-[1.02]"
              >
                Choose {premium.name} <ArrowUpRight className="size-4" />
              </a>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {premium.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/20">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-white/90">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Supporting plans */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rest.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="group flex flex-col rounded-[1.75rem] border border-border bg-background p-8 transition-colors hover:border-border-strong"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-3xl tracking-tight">{p.name}</h3>
                <span className="text-lg font-semibold">
                  {formatINR(p.price)}
                  <span className="text-sm font-normal text-muted">{p.period}</span>
                </span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald" strokeWidth={2.5} />
                    {perk}
                  </li>
                ))}
              </ul>
              <a
                href={`/book?amc=${p.id}`}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors group-hover:text-royal-bright"
              >
                Choose {p.name}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
