"use client";

import { useRef } from "react";
import { useSiteImage } from "@/components/providers/SiteImagesProvider";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Star, ShieldCheck, Clock } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const RED = "#e11d2a";

export function Hero() {
  const heroTechnicianSrc = useSiteImage("hero-technician");
  // With no photo the copy has the whole width to itself rather than sitting
  // in half a hero with an empty half beside it.
  const copyCols = heroTechnicianSrc
    ? "col-span-12 sm:col-span-7 lg:col-span-6"
    : "col-span-12 lg:col-span-9";
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yType = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-28 sm:pt-32"
      style={{ background: "var(--background)" }}
    >
      {/* dotted texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div className="relative mx-auto max-w-[92rem] px-6 pb-12 sm:px-10 sm:pb-48">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-8" style={{ background: RED }} />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.26em]" style={{ color: RED }}>
            Fast · Certified · 24×7
          </span>
        </motion.div>

        <div className="mt-6 grid grid-cols-12 items-end gap-x-4 gap-y-5 sm:mt-8 sm:gap-y-7 lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-y-0">
          {/* Headline — sits beside the technician on every screen */}
          <motion.div
            style={{ y: yType }}
            className={`relative z-10 self-start lg:row-start-1 ${copyCols}`}
          >
            <h1 className="font-display text-[1.75rem] leading-[1.06] tracking-[-0.03em] sm:text-[3.2rem] md:text-[4rem] lg:text-[6.2rem]">
              <Line delay={0.05}>Broken today.</Line>
              <Line delay={0.14}>
                <span className="italic" style={{ color: RED }}>Flawless</span>
              </Line>
              <Line delay={0.22}>by evening.</Line>
            </h1>
          </motion.div>

          {/* Supporting copy — still beside the technician, under the headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            /* justified on phones so the narrow column has a clean right edge;
               hyphenation keeps the word gaps from opening up */
            className={`col-start-1 row-start-2 max-w-md hyphens-auto self-start text-justify text-[0.875rem] leading-relaxed text-muted sm:text-pretty sm:text-left sm:text-base lg:mt-8 lg:text-lg ${copyCols}`}
          >
            Certified doorstep repair, installation and maintenance for Samsung, LG,
            IFB &amp; Bosch — genuine parts, a 90-day warranty, and a technician you can
            actually track.
          </motion.p>

          {/* CTAs and proof — full width below the technician */}
          <div
            className={`col-span-12 col-start-1 lg:self-start ${
              heroTechnicianSrc ? "row-start-4 sm:row-start-3 lg:col-span-6" : "row-start-3 lg:col-span-9"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.62, ease }}
              /* Both actions share one row on phones — at 400px the pair is a
                 little wider than the column, so they split it instead of the
                 second wrapping onto its own line. */
              className="flex items-center gap-2 sm:flex-wrap sm:gap-3 lg:mt-10"
            >
              <Link
                href="/book"
                className="group inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-3 text-[0.8rem] font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] sm:flex-none sm:justify-start sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[0.95rem]"
                style={{ background: RED, boxShadow: `0 16px 40px -12px ${RED}99` }}
              >
                <span className="truncate">Book a service</span>
                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/book?emergency=1"
                className="group inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-black/15 px-2.5 py-3 text-[0.8rem] font-medium text-ink transition-colors hover:bg-black/5 sm:flex-none sm:justify-start sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[0.95rem]"
              >
                <span className="relative grid size-2 shrink-0 place-items-center">
                  <span className="absolute size-2 animate-ping rounded-full" style={{ background: RED }} />
                  <span className="size-2 rounded-full" style={{ background: RED }} />
                </span>
                <span className="truncate">Emergency repair</span>
                {/* decorative — dropped on phones so the label keeps its room */}
                <span className="hidden transition-transform group-hover:translate-x-0.5 sm:inline">→</span>
              </Link>
            </motion.div>

            {/* proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-7 grid grid-cols-2 gap-x-4 gap-y-4 sm:mt-12 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4"
            >
              <Proof icon={<Star className="size-4 fill-amber text-amber" />} big="4.9/5" small="128k reviews" />
              <span className="hidden h-8 w-px bg-black/10 sm:block" />
              <Proof icon={<ShieldCheck className="size-4 text-emerald-bright" />} big="90 days" small="repair warranty" />
              <span className="hidden h-8 w-px bg-black/10 sm:block" />
              <Proof icon={<Clock className="size-4" style={{ color: RED }} />} big="< 90 min" small="avg. arrival" />
            </motion.div>
          </div>

          {/* The photo, with the chips that float against its edges — they have
              nothing to float against once it's deleted, so they go with it. */}
          {heroTechnicianSrc && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            /* A phone column is ~130px wide — four photographs can't live in
               that, and widening it past the column is what was cutting the
               collage off at both edges. Below sm it gets a row of its own. */
            className="relative col-span-12 row-start-3 flex items-end justify-end self-end sm:col-span-5 sm:col-start-8 sm:row-span-2 sm:row-start-1 lg:col-span-6 lg:col-start-7 lg:row-span-3 lg:self-stretch"
          >
            {/* The supplied artwork is cropped: 503px of the washing-machine
                diamond and 212px of the AC one run straight off its own right
                and top edges. No pixels exist beyond those, so the collage is
                pushed past the page's right edge instead — a photograph that
                continues off the page reads as intentional where the same cut
                in mid-air reads as broken. */}
            <div className="relative -mr-6 w-full max-w-[22rem] sm:mr-[calc(-2.5rem_-_max(0px,(100vw_-_92rem)/2))] sm:max-w-[34rem]">
              {/* soft backdrop */}
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-[120px]" />
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroTechnicianSrc}
                alt="24X7 technicians servicing an air conditioner, refrigerator, washing machine and microwave"
                className="w-full drop-shadow-[0_28px_50px_rgba(60,52,40,0.25)]"
              />

              {/* Floating proof chips. On a phone they sit on the collage
                  rather than beside it — there is no room outside it — so the
                  hero still reads the way it does on a desktop. */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-2 top-12 flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1.5 shadow-premium-lg backdrop-blur sm:-left-10 sm:top-20 sm:gap-2 sm:px-3.5 sm:py-2"
              >
                <ShieldCheck className="size-3.5 text-emerald sm:size-4" />
                <span className="text-[0.68rem] font-semibold text-ink sm:text-xs">Brand-authorised pro</span>
              </motion.div>

              {/* floating live card — lower left */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-3 bottom-16 rounded-xl border border-card-edge bg-card px-3 py-2 shadow-premium-xl sm:-left-12 sm:bottom-24 sm:rounded-2xl sm:px-4 sm:py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald" />
                  </span>
                  <p className="text-[0.68rem] font-semibold text-ink sm:text-[0.72rem]">Ravi is on the way</p>
                </div>
                <p className="mt-0.5 text-[0.6rem] text-muted sm:mt-1 sm:text-[0.64rem]">Arriving in 8 min · live tracking</p>
              </motion.div>
            </div>
          </motion.div>
          )}
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
    <div className="flex items-center gap-2 sm:gap-2.5">
      {icon}
      <div className="leading-none">
        <p className="text-sm font-semibold text-ink sm:text-base">{big}</p>
        <p className="mt-1 text-[0.65rem] text-muted sm:text-xs">{small}</p>
      </div>
    </div>
  );
}
