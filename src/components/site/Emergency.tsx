"use client";

import { motion } from "framer-motion";
import { PhoneCall, ArrowUpRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

const ease = [0.16, 1, 0.3, 1] as const;

const LIVE = [
  { city: "Bengaluru", job: "fridge", status: "dispatched 2m ago", tint: "#d64545" },
  { city: "Mumbai", job: "washer", status: "en route", tint: "#d9821b" },
  { city: "Delhi", job: "microwave", status: "completed", tint: "#0b9a63" },
];

export function Emergency() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[#08080a] px-6 py-12 text-white shadow-premium-xl sm:rounded-[2.5rem] sm:px-12 sm:py-16">
          {/* animated glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(214,69,69,0.3), transparent 62%)" }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.72rem] font-medium tracking-tight backdrop-blur"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger" />
                <span className="relative inline-flex size-2 rounded-full bg-danger" />
              </span>
              Live dispatch · available now
            </motion.div>

            <h2 className="font-display mt-6 text-[1.9rem] leading-[1.04] tracking-[-0.03em] sm:text-[3.2rem] lg:text-[3.8rem]">
              <Reveal>Appliance down?</Reveal>
              <Reveal delay={0.1}>
                <span className="italic text-white/55">We move fast.</span>
              </Reveal>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              className="mx-auto mt-5 max-w-md text-pretty text-[0.9rem] leading-relaxed text-white/65 sm:text-base"
            >
              A certified specialist dispatched with priority — averaging under 90 minutes to
              your door. No surge pricing, just help when it matters most.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <MagneticButton href="/book?emergency=1" tone="emerald" className="h-12 px-6 text-[0.88rem]">
                Request emergency repair <ArrowUpRight className="size-4" />
              </MagneticButton>
              <a
                href="tel:18002000247"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-[0.88rem] font-medium text-white transition-colors hover:bg-white/10"
              >
                <PhoneCall className="size-4" /> 1800-200-247
              </a>
            </motion.div>

            {/* live job ticker */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-2"
            >
              {LIVE.map((l) => (
                <span
                  key={l.city}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.68rem] text-white/55 backdrop-blur"
                >
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: l.tint }} />
                  <span className="font-medium text-white/75">{l.city}</span>
                  <span className="text-white/30">·</span>
                  {l.job} {l.status}
                </span>
              ))}
            </motion.div>
          </div>
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
        transition={{ duration: 0.9, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}
