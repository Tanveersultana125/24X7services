"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

const PILLARS = [
  {
    icon: ShieldCheck,
    tint: "#2547d0",
    title: "Trustworthiness",
    desc: "Brand-authorised technicians, 100% genuine spare parts, and a 90-day warranty on every single repair.",
  },
  {
    icon: BadgeCheck,
    tint: "#0b9a63",
    title: "Professionalism",
    desc: "Trained, background-verified pros who arrive on time, in uniform, and treat your home with real care.",
  },
  {
    icon: Star,
    tint: "#d9821b",
    title: "Customer Satisfaction",
    desc: "Rated 4.9/5 across 128k+ services — with live technician tracking and transparent, upfront pricing.",
  },
];

export function TrustStrip() {
  return (
    <section className="relative z-20 -mt-24 pb-6 pt-4 sm:-mt-32 sm:pb-8 sm:pt-6">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
              className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-7 shadow-premium-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-premium-lg"
            >
              <span
                className="grid size-12 place-items-center rounded-2xl shadow-premium-sm"
                style={{ background: `${p.tint}16`, color: p.tint }}
              >
                <p.icon className="size-6" strokeWidth={1.8} />
              </span>

              <h3 className="font-display mt-6 text-2xl tracking-[-0.02em]">{p.title}</h3>
              <p className="mt-3 text-pretty leading-relaxed text-muted">{p.desc}</p>

              {/* thin brand rule that grows on hover */}
              <span
                aria-hidden
                className="mt-6 block h-0.5 w-10 rounded-full transition-all duration-500 group-hover:w-16"
                style={{ background: p.tint }}
              />
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
          >
            Book a certified technician
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
