"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const PLANS = ["Essential", "Premium", "Business"];
const POPULAR = 1;

type Cell = boolean | string;
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
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>Compare</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Every plan, side by side.
        </h2>

        {/* Below lg the four-column table can't fit a phone, so each plan becomes
            its own card with the same rows read top to bottom. */}
        <div className="mt-10 space-y-4 lg:hidden">
          {PLANS.map((plan, col) => (
            <motion.div
              key={plan}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: col * 0.06 }}
              className={cn(
                "rounded-[1.5rem] border bg-surface p-5 shadow-premium-sm sm:p-6",
                col === POPULAR ? "border-royal-bright/40 bg-royal-bright/[0.04]" : "border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <p className="font-display text-2xl tracking-tight">{plan}</p>
                {col === POPULAR && <PopularBadge />}
              </div>

              <dl className="mt-3 divide-y divide-hairline">
                {ROWS.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-5 py-3">
                    <dt className="text-sm text-ink-soft">{row.label}</dt>
                    <dd className="flex shrink-0 justify-end text-right">
                      <Value v={row.values[col]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </div>

        {/* lg and up: the real side-by-side table */}
        <div className="mt-14 hidden lg:block">
          {/* header */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-end gap-4 border-b border-border pb-5">
            <span className="text-sm font-medium text-muted">What&apos;s included</span>
            {PLANS.map((p, col) => (
              <div key={p} className="text-center">
                {col === POPULAR && <PopularBadge className="mb-2" />}
                <p className="font-display text-xl tracking-tight">{p}</p>
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
