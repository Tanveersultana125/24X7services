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

function Tick() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald/12 text-emerald sm:size-6">
      <BadgeCheck className="size-3 sm:size-3.5" />
    </span>
  );
}

export function CoolingSolutions() {
  const [open, setOpen] = useState(2);

  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto grid max-w-[92rem] grid-cols-12 gap-x-4 gap-y-8 px-6 sm:px-10 lg:grid-rows-[auto_1fr] lg:items-center lg:gap-x-16">
        {/* heading — shares the first row with the photo on every screen */}
        <div className="col-span-7 row-start-1 self-center lg:col-span-6 lg:self-end">
          <Kicker>Smart cooling</Kicker>
          <h2 className="font-display mt-5 text-[1.5rem] leading-[1.08] tracking-[-0.03em] sm:mt-6 sm:text-[2.4rem] lg:text-5xl">
            Smart cooling solutions
            <br />
            for modern homes.
          </h2>
        </div>

        {/* accordion */}
        <div className="col-span-12 col-start-1 row-start-3 lg:col-span-6 lg:row-start-2 lg:self-start">
          <div className="border-t border-hairline">
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
        <div className="relative col-span-5 col-start-8 row-start-1 self-center lg:col-span-6 lg:col-start-7 lg:row-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-[2rem] border border-white/70 shadow-premium-xl"
          >
            {/* squarer crop on phones so the floating card covers a similar share of the
                frame as it does on desktop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/work/family-ac.png" alt="A family enjoying cool comfort at home" className="aspect-square w-full object-cover sm:aspect-[4/3]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-6 left-8 hidden rounded-2xl border border-white/70 bg-white/95 p-6 shadow-premium-xl backdrop-blur lg:block"
          >
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                  <Tick />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* below lg the photo column is too narrow to float a card over — run the perks
            as a full-width strip between the heading row and the accordion instead */}
        <div className="col-span-12 col-start-1 row-start-2 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm lg:hidden">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[0.74rem] font-medium leading-tight text-ink">
                <Tick />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
