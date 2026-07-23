"use client";

import { motion } from "framer-motion";
import { Wind, ShieldCheck, Gauge } from "lucide-react";
import { Kicker } from "./TextReveal";

const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  { icon: Wind, tint: "#2547d0", title: "Dependable AC service", body: "Expert installation, deep-clean, gas top-up and repair for every split and window unit — done in one visit." },
  { icon: ShieldCheck, tint: "#0b9a63", title: "Genuine parts & warranty", body: "Only brand-approved components, fitted by certified pros, and backed by a 90-day written warranty." },
  { icon: Gauge, tint: "#d9821b", title: "Efficient climate care", body: "Advanced tools and diagnostics keep your appliances running cooler, quieter and more energy-efficient." },
];

export function ClimateExpertise() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto grid max-w-[92rem] gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease }}
          className="overflow-hidden rounded-[2rem] border border-white/70 shadow-premium-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/work/ac-service.png" alt="Certified technician servicing an air conditioner" className="aspect-[4/3] w-full object-cover" />
        </motion.div>

        {/* features */}
        <div>
          <Kicker>Our expertise</Kicker>
          <h2 className="font-display mt-6 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Cooling solutions,
            <br />
            done right.
          </h2>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
            We prioritise your comfort — dependable, skilled technicians deliver efficient service for
            every appliance in your home.
          </p>

          <div className="mt-10 space-y-7">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                className="flex gap-4"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_10px_20px_-6px_rgba(23,21,15,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]"
                  style={{ background: `linear-gradient(145deg, ${f.tint}, ${f.tint}cc)` }}
                >
                  <f.icon className="size-6" strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 max-w-md text-pretty leading-relaxed text-muted">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
