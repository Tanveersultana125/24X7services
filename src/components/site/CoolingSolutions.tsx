"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BadgeCheck, ArrowUpRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const ITEMS = [
  { title: "Fast & easy AC booking", body: "Pick your appliance, describe the fault, choose a slot — confirmed in under two minutes, no call centres." },
  { title: "Seamless service experience", body: "One tracked visit from diagnosis to fix. Live ETA, a uniformed pro, and a transparent digital invoice." },
  { title: "Book your service in minutes", body: "Same-day and next-day windows down to the hour. Instant confirmation and a certified technician at your doorstep." },
  { title: "Quick & simple appointments", body: "Reschedule or rebook in a tap. No haggling, no waiting around — just cool comfort, restored." },
];

const PERKS = ["Discounted AC repairs", "AMC maintenance specials", "Free on-site inspection", "Brand-certified technicians"];

export function CoolingSolutions() {
  const [open, setOpen] = useState(2);

  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto grid max-w-[92rem] gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* accordion */}
        <div>
          <Kicker>Smart cooling</Kicker>
          <h2 className="font-display mt-6 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Smart cooling solutions
            <br />
            for modern homes.
          </h2>

          <div className="mt-8 border-t border-hairline">
            {ITEMS.map((it, i) => (
              <div key={it.title} className="border-b border-hairline">
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={open === i}
                >
                  <span className={cn("text-lg font-medium transition-colors", open === i ? "text-ink" : "text-ink-soft")}>
                    {it.title}
                  </span>
                  <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform duration-300", open === i && "rotate-180 text-royal-bright")} />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-md pb-5 text-pretty leading-relaxed text-muted">{it.body}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <Link
            href="/book"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
          >
            Book your service <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {/* image + floating perks card */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-[2rem] border border-white/70 shadow-premium-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/work/family-ac.png" alt="A family enjoying cool comfort at home" className="aspect-[4/3] w-full object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            /* on phones the card is nearly as wide as the photo, so it hid the whole scene —
               keep it in flow there and only float it once there is room to overlap */
            className="relative mt-4 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-premium-xl backdrop-blur sm:absolute sm:-bottom-6 sm:left-8 sm:mt-0 sm:p-6"
          >
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                  <span className="grid size-6 place-items-center rounded-full bg-emerald/12 text-emerald">
                    <BadgeCheck className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
