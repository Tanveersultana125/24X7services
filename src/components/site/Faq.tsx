"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How fast can a technician reach me?", a: "Book by 2 PM for same-day service. Emergency requests are prioritised and average under 90 minutes in serviced cities." },
  { q: "Are the spare parts genuine?", a: "Always. We use only brand-approved, traceable components — and every part is covered by our 90-day warranty alongside the repair." },
  { q: "What does the 90-day warranty cover?", a: "If the same issue recurs within 90 days of the visit, we return and fix it at no cost — parts and labour included, no questions asked." },
  { q: "Which brands and appliances do you service?", a: "Samsung, LG, IFB and Bosch — across refrigerators, washing machines, microwaves and ovens, plus installation, uninstallation and annual maintenance." },
  { q: "How is pricing decided?", a: "You see a transparent estimate before booking, tuned to your brand, model and city. There are no surprise charges — the technician confirms the final quote on site before any work begins." },
  { q: "Can I reschedule or cancel?", a: "Yes, free of charge any time before the technician is dispatched. You can manage everything from your dashboard or the AI assistant." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-28 py-28 sm:py-36">
      <div className="mx-auto grid max-w-[92rem] gap-14 px-6 sm:px-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Kicker>Questions</Kicker>
            <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Everything,
              <br />
              answered.
            </h2>
            <p className="mt-6 max-w-xs text-pretty text-muted">
              Still curious? Our AI assistant replies in seconds, any hour — or call{" "}
              <a href="tel:18002000247" className="text-ink underline underline-offset-4">1800-200-247</a>.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ul>
            {FAQS.map((f, i) => {
              const active = open === i;
              return (
                <li key={f.q} className="border-b border-hairline">
                  <button
                    onClick={() => setOpen(active ? null : i)}
                    className="flex w-full items-start gap-6 py-7 text-left"
                    aria-expanded={active}
                  >
                    <span className="font-mono text-sm text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-lg font-medium tracking-tight sm:text-xl">{f.q}</span>
                    <span className={cn("mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-border transition-all duration-500", active && "rotate-45 border-royal-bright bg-royal-bright text-white")}>
                      <Plus className="size-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 pl-12 pr-8 text-pretty leading-relaxed text-muted">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
