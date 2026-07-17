"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Star, ShieldCheck, Clock } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { AppliancePlinth } from "./AppliancePlinth";
import { Marquee } from "./Marquee";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yProduct = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yType = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-28 sm:pt-32">
      {/* meta row */}
      <div className="mx-auto flex max-w-[92rem] items-center justify-between px-6 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-muted sm:px-10">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          Appliance care, elevated
        </motion.span>
      </div>

      <div className="relative mx-auto grid max-w-[92rem] grid-cols-1 items-center gap-8 px-6 pt-6 sm:px-10 lg:grid-cols-12 lg:pt-4">
        {/* Headline block — asymmetric, spans 7 cols */}
        <motion.div style={{ y: yType }} className="relative z-10 lg:col-span-7">
          <h1 className="font-display text-[3.4rem] leading-[1.04] tracking-[-0.03em] sm:text-[5rem] lg:text-[6.4rem]">
            <Line delay={0.05}>Broken today.</Line>
            <Line delay={0.14}>
              <span className="italic text-royal-bright">Flawless</span>
            </Line>
            <Line delay={0.22}>by evening.</Line>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-8 max-w-md text-pretty text-lg leading-relaxed text-muted"
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
            <MagneticButton href="/book" tone="ink">
              Book a service
              <ArrowUpRight className="size-4" />
            </MagneticButton>
            <a
              href="/book?emergency=1"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-3 text-[0.95rem] font-medium text-ink"
            >
              <span className="grid size-2 place-items-center">
                <span className="size-2 animate-ping rounded-full bg-danger" />
                <span className="absolute size-2 rounded-full bg-danger" />
              </span>
              Emergency repair
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </motion.div>

          {/* inline proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <Proof icon={<Star className="size-4 fill-amber text-amber" />} big="4.9/5" small="128k reviews" />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <Proof icon={<ShieldCheck className="size-4 text-emerald" />} big="90 days" small="repair warranty" />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <Proof icon={<Clock className="size-4 text-royal-bright" />} big="< 90 min" small="avg. arrival" />
          </motion.div>
        </motion.div>

        {/* Product — spans 5 cols, floats & parallaxes */}
        <motion.div style={{ y: yProduct, opacity }} className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
            className="relative mx-auto max-w-sm"
          >
            <AppliancePlinth className="w-full drop-shadow-2xl" />

            {/* floating certified tag */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 top-16 flex items-center gap-2 rounded-2xl glass-strong px-3.5 py-2.5 shadow-premium-lg sm:-left-6"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-emerald/15 text-emerald">
                <ShieldCheck className="size-4" />
              </span>
              <div className="text-left">
                <p className="text-[0.7rem] font-semibold leading-none">Certified pro</p>
                <p className="mt-1 text-[0.65rem] text-muted">Brand-authorised</p>
              </div>
            </motion.div>

            {/* floating ETA card */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-2 bottom-20 rounded-2xl glass-strong px-4 py-3 shadow-premium-lg sm:-right-8"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-emerald" />
                <p className="text-[0.7rem] font-semibold">Ravi · 8 min away</p>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 1, 1, 0.4, 0.2].map((o, i) => (
                  <span key={i} className="h-1 w-6 rounded-full bg-emerald" style={{ opacity: o }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Brand marquee footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-16 border-y border-hairline py-6 sm:mt-20"
      >
        <Marquee>
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="flex items-center gap-16">
              <BrandMark id={b.id} className="text-xl text-muted opacity-70" />
            </span>
          ))}
        </Marquee>
      </motion.div>
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
        <p className="text-base font-semibold">{big}</p>
        <p className="mt-1 text-xs text-muted">{small}</p>
      </div>
    </div>
  );
}
