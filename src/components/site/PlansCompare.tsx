"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, ArrowUpRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { AMC_PLANS } from "@/lib/data";
import { formatINR, cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/** Index of the plan we badge as popular, within AMC_PLANS. */
const POPULAR = 1;

type Cell = boolean | string;

/** Each `values` tuple is ordered to match AMC_PLANS — essential, premium, business. */
const ROWS: { label: string; values: [Cell, Cell, Cell] }[] = [
  { label: "Preventive maintenance visits", values: ["2 / year", "4 / year", "8 / year"] },
  { label: "Priority same-day support", values: [true, true, "4-hour SLA"] },
  { label: "Discount on repairs", values: ["10% off", "Labour free", "Labour free"] },
  { label: "Genuine spare parts included", values: [false, true, true] },
  { label: "Predictive maintenance alerts", values: [false, true, true] },
  { label: "Appliances covered", values: ["1 appliance", "Whole home", "Up to 8"] },
  { label: "Relationship manager", values: [false, true, "Dedicated"] },
  { label: "Consolidated GST invoicing", values: [true, true, true] },
];

/** Included / not included / a specific limit — the same mark in both layouts. */
function Value({ v }: { v: Cell }) {
  if (typeof v !== "boolean") return <span className="text-sm font-medium">{v}</span>;
  return v ? (
    <span className="grid size-6 place-items-center rounded-full bg-emerald/15 text-emerald">
      <Check className="size-4" strokeWidth={2.5} />
    </span>
  ) : (
    <Minus className="size-4 text-muted-2" />
  );
}

function PopularBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-royal-bright px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white",
        className,
      )}
    >
      Popular
    </span>
  );
}

export function PlansCompare() {
  const [active, setActive] = useState(POPULAR);
  const plan = AMC_PLANS[active];

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>Compare</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Every plan, side by side.
        </h2>

        {/* Below lg a four-column table can't fit a phone, and stacking all three
            plans would repeat every label three times — so you pick one instead. */}
        <div className="mt-10 lg:hidden">
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-premium-sm">
            {AMC_PLANS.map((p, i) => {
              const on = i === active;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className="relative flex-1 rounded-full px-2 py-2.5 text-[0.82rem] font-medium transition-colors"
                >
                  {on && (
                    <motion.span
                      layoutId="compare-tab"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ duration: 0.35, ease }}
                    />
                  )}
                  {/* The pill is `ink`, which is near-black on paper and
                      near-white on a dark page — so its label has to be the
                      page colour, not white, or the selected tab disappears
                      into its own pill in dark mode. */}
                  <span className={cn("relative", on ? "text-background" : "text-muted")}>{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-border bg-surface p-5 shadow-premium-sm sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-2.5">
                <p className="font-display text-2xl tracking-tight">{plan.name}</p>
                {active === POPULAR && <PopularBadge />}
              </div>
              <p className="text-lg font-semibold">
                {formatINR(plan.price)}
                <span className="text-sm font-normal text-muted">{plan.period}</span>
              </p>
            </div>

            <dl className="mt-4 divide-y divide-hairline">
              {ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-5 py-3">
                  <dt className="text-sm text-ink-soft">{row.label}</dt>
                  {/* re-keyed on the plan so each value animates in on switch */}
                  <motion.dd
                    key={active}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease }}
                    className="flex shrink-0 justify-end text-right"
                  >
                    <Value v={row.values[active]} />
                  </motion.dd>
                </div>
              ))}
            </dl>

            <a
              href={`/book?amc=${plan.id}`}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Choose {plan.name} <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>

        {/* lg and up: the real side-by-side table */}
        <div className="mt-14 hidden lg:block">
          {/* header */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-end gap-4 border-b border-border pb-5">
            <span className="text-sm font-medium text-muted">What&apos;s included</span>
            {AMC_PLANS.map((p, col) => (
              <div key={p.id} className="text-center">
                {col === POPULAR && <PopularBadge className="mb-2" />}
                <p className="font-display text-xl tracking-tight">{p.name}</p>
              </div>
            ))}
          </div>

          {/* rows */}
          {ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-4 border-b border-hairline py-4"
            >
              <span className="text-sm text-ink-soft">{row.label}</span>
              {row.values.map((v, j) => (
                <div
                  key={j}
                  className={cn(
                    "flex justify-center text-center",
                    j === POPULAR && "rounded-xl bg-royal-bright/5 py-1",
                  )}
                >
                  <Value v={v} />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
