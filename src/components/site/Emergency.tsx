"use client";

import { motion } from "framer-motion";
import { PhoneCall, ArrowUpRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

export function Emergency() {
  return (
    <section className="relative overflow-hidden bg-[#08080a] py-28 text-white sm:py-40">
      {/* animated glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,69,69,0.32), transparent 62%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "64px 64px" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger" />
            <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
          </span>
          Live dispatch · available now
        </motion.div>

        <h2 className="font-display mt-8 text-[3rem] leading-[1.0] tracking-[-0.03em] sm:text-[6rem]">
          <Reveal>Appliance down?</Reveal>
          <Reveal delay={0.1}>
            <span className="italic text-white/60">We move fast.</span>
          </Reveal>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-8 max-w-xl text-pretty text-lg text-white/70"
        >
          A certified specialist dispatched with priority — averaging under 90 minutes to
          your door. No surge pricing games. Just help, when it matters most.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="/book?emergency=1" tone="emerald">
            Request emergency repair <ArrowUpRight className="size-4" />
          </MagneticButton>
          <a
            href="tel:18002000247"
            className="inline-flex h-14 items-center gap-2.5 rounded-full border border-white/20 px-8 text-[0.95rem] font-medium text-white transition-colors hover:bg-white/10"
          >
            <PhoneCall className="size-4" /> 1800-200-247
          </a>
        </motion.div>

        {/* ticker of live jobs */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/40">
          <span>Bengaluru · fridge · dispatched 2m ago</span>
          <span className="hidden sm:inline">·</span>
          <span>Mumbai · washer · en route</span>
          <span className="hidden sm:inline">·</span>
          <span>Delhi · microwave · completed</span>
        </div>
      </div>
    </section>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em] pt-[0.02em]">
      <motion.span
        className="block"
        initial={{ y: "112%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}
