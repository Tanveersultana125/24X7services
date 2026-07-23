"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const PLANS = ["Essential", "Premium", "Business"];

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

export function PlansCompare() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>Compare</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Every plan, side by side.
        </h2>

        <div className="mt-10 sm:mt-14 overflow-x-auto">
          <div className="min-w-[44rem]">
            {/* header */}
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-end gap-4 border-b border-border pb-5">
              <span className="text-sm font-medium text-muted">What&apos;s included</span>
              {PLANS.map((p) => (
                <div key={p} className={cn("text-center", p === "Premium" && "relative")}>
                  {p === "Premium" && (
                    <span className="mb-2 inline-block rounded-full bg-royal-bright px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
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
                  <div key={j} className={cn("flex justify-center text-center", j === 1 && "rounded-xl bg-royal-bright/5 py-1")}>
                    {typeof v === "boolean" ? (
                      v ? (
                        <span className="grid size-6 place-items-center rounded-full bg-emerald/15 text-emerald">
                          <Check className="size-4" strokeWidth={2.5} />
                        </span>
                      ) : (
                        <Minus className="size-4 text-muted-2" />
                      )
                    ) : (
                      <span className="text-sm font-medium">{v}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
