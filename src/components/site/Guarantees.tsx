"use client";

import { motion } from "framer-motion";
import { Timer, Tag, ShieldCheck, HeartHandshake } from "lucide-react";
import { Kicker } from "./TextReveal";

const PROMISES = [
  { icon: Timer, title: "On-time, or it's on us", desc: "If your technician misses the confirmed slot window, the visit fee is waived — automatically." },
  { icon: Tag, title: "Fixed-price, upfront", desc: "The estimate you approve is the price you pay. No mid-job surprises, no inflated add-ons." },
  { icon: ShieldCheck, title: "90-day repair warranty", desc: "Same issue within 90 days? We return and fix it free — parts and labour included." },
  { icon: HeartHandshake, title: "Can't fix it? Full refund", desc: "If we genuinely can't resolve the fault, you pay nothing. That's our satisfaction guarantee." },
];

export function Guarantees() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Our promises</Kicker>
          <h2 className="font-display mt-6 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Four guarantees, in writing.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="flex gap-5 rounded-[1.75rem] border border-border bg-surface p-8"
            >
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-royal text-white">
                <p.icon className="size-6" strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
