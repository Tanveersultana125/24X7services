"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Star, ShieldCheck, Clock } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const RED = "#e11d2a";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yType = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#131018] pt-28 text-white sm:pt-32">
      {/* dotted texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-20 size-[38rem] rounded-full blur-[130px]" style={{ background: `${RED}33` }} />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 size-[30rem] rounded-full bg-royal-bright/15 blur-[130px]" />

      <div className="relative mx-auto max-w-[92rem] px-6 pb-40 sm:px-10 sm:pb-48">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-8" style={{ background: RED }} />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.26em]" style={{ color: "#ff6b6b" }}>
            Fast · Certified · 24×7
          </span>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Headline */}
          <motion.div style={{ y: yType }} className="relative z-10 lg:col-span-6">
            <h1 className="font-display text-[3.4rem] leading-[1.03] tracking-[-0.03em] sm:text-[5rem] lg:text-[6.2rem]">
              <Line delay={0.05}>Broken today.</Line>
              <Line delay={0.14}>
                <span className="italic" style={{ color: "#ff5c5c" }}>Flawless</span>
              </Line>
              <Line delay={0.22}>by evening.</Line>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-8 max-w-md text-pretty text-lg leading-relaxed text-white/65"
            >
              Certified doorstep repair, installation and maintenance for Samsung, LG,
              IFB &amp; Bosch — genuine parts, a 90-day warranty, and a technician you can
              actually track.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.62, ease }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
                style={{ background: RED, boxShadow: `0 16px 40px -12px ${RED}99` }}
              >
                Book a service
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/book?emergency=1"
                className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-[0.95rem] font-medium text-white transition-colors hover:bg-white/10"
              >
                <span className="relative grid size-2 place-items-center">
                  <span className="absolute size-2 animate-ping rounded-full" style={{ background: "#ff6b6b" }} />
                  <span className="size-2 rounded-full" style={{ background: "#ff6b6b" }} />
                </span>
                Emergency repair
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </motion.div>

            {/* proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <Proof icon={<Star className="size-4 fill-amber text-amber" />} big="4.9/5" small="128k reviews" />
              <span className="hidden h-8 w-px bg-white/15 sm:block" />
              <Proof icon={<ShieldCheck className="size-4 text-emerald-bright" />} big="90 days" small="repair warranty" />
              <span className="hidden h-8 w-px bg-white/15 sm:block" />
              <Proof icon={<Clock className="size-4" style={{ color: "#ff6b6b" }} />} big="< 90 min" small="avg. arrival" />
            </motion.div>
          </motion.div>

          {/* Technician cutout — points toward the headline */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="relative lg:col-span-6"
          >
            {/* blue glow backdrop */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-royal-bright/25 blur-[100px]" />
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/technician.png"
              alt="24X7 certified service technician"
              className="mx-auto w-full max-w-[20rem] drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />

            {/* floating brand-authorised chip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-8 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-premium-lg backdrop-blur"
            >
              <ShieldCheck className="size-4 text-emerald" />
              <span className="text-xs font-semibold text-ink">Brand-authorised pro</span>
            </motion.div>

            {/* floating live card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-6 left-0 rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-premium-xl"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald" />
                </span>
                <p className="text-[0.72rem] font-semibold text-ink">Ravi is on the way</p>
              </div>
              <p className="mt-1 text-[0.64rem] text-muted">Arriving in 8 min · live tracking</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em] pt-[0.02em]">
      <motion.span
        className="block"
        initial={{ y: "112%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Proof({ icon, big, small }: { icon: React.ReactNode; big: string; small: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div className="leading-none">
        <p className="text-base font-semibold text-white">{big}</p>
        <p className="mt-1 text-xs text-white/55">{small}</p>
      </div>
    </div>
  );
}
