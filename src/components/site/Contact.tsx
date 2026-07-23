"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, PhoneCall, MessageSquareText, Mail } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

const CHANNELS = [
  { icon: PhoneCall, label: "Call us", value: "1800-200-247", href: "tel:18002000247" },
  { icon: MessageSquareText, label: "Chat with AI", value: "Replies in seconds", href: "/book" },
  { icon: Mail, label: "Email", value: "care@24x7services.in", href: "mailto:care@24x7services.in" },
];

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-28 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface px-8 py-16 sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-emerald/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-royal-bright/10 blur-3xl" />

          <div className="relative grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[3rem] leading-[0.95] tracking-[-0.03em] sm:text-[5rem]"
              >
                Let&apos;s get it
                <br />
                <span className="italic text-royal-bright">fixed.</span>
              </motion.h2>
              <p className="mt-8 max-w-md text-pretty text-lg text-muted">
                A certified expert, genuine parts and a 90-day warranty are 60 seconds away.
                Book now — or reach us however you like.
              </p>
              <div className="mt-10">
                <MagneticButton href="/book" tone="ink">
                  Book a service <ArrowUpRight className="size-4" />
                </MagneticButton>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-hairline">
              {CHANNELS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="group flex items-center gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink transition-colors group-hover:bg-royal-bright group-hover:text-white">
                    <c.icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">{c.label}</p>
                    <p className="text-lg font-medium tracking-tight">{c.value}</p>
                  </div>
                  <ArrowUpRight className="size-5 text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-royal-bright" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
