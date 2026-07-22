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
    <section className="relative z-20 -mt-8 pb-6 pt-4 sm:-mt-32 sm:pb-8 sm:pt-6">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
              className="group relative overflow-hidden rounded-[1.1rem] border border-white/70 bg-gradient-to-b from-white to-surface p-3 text-center sm:rounded-[1.75rem] sm:p-7 sm:text-left shadow-[0_18px_40px_-18px_rgba(23,21,15,0.2),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-16px_28px_-20px_rgba(23,21,15,0.12)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_38px_64px_-24px_rgba(23,21,15,0.32),inset_0_1.5px_0_rgba(255,255,255,0.95)]"
            >
              {/* glossy top sheen */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent" />

              <span
                className="relative mx-auto grid size-9 place-items-center rounded-xl shadow-[0_8px_16px_-4px_rgba(23,21,15,0.22),inset_0_1px_0_rgba(255,255,255,0.7)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105 sm:mx-0 sm:size-12 sm:rounded-2xl"
                style={{ background: `${p.tint}18`, color: p.tint }}
              >
                <p.icon className="size-[1.1rem] sm:size-6" strokeWidth={1.8} />
              </span>

              <h3 className="font-display mt-3 hyphens-auto text-[0.7rem] leading-tight tracking-[-0.01em] sm:mt-6 sm:text-2xl sm:tracking-[-0.02em]">{p.title}</h3>
              {/* the blurb is unreadable in a ~6rem column — keep it for sm and up */}
              <p className="hidden text-pretty leading-relaxed text-muted sm:mt-3 sm:block sm:text-base">{p.desc}</p>

              {/* thin brand rule that grows on hover */}
              <span
                aria-hidden
                className="mx-auto mt-3 block h-0.5 w-5 rounded-full transition-all duration-500 group-hover:w-16 sm:mx-0 sm:mt-6 sm:w-10"
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
