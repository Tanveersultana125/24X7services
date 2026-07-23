"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  PhoneCall,
  MessageSquareText,
  Mail,
  ShieldCheck,
  CalendarDays,
  PackageCheck,
  BadgeCheck,
  Users,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const VIOLET = "#6d5ae0";

const CHANNELS = [
  {
    icon: PhoneCall,
    tint: ROYAL,
    label: "Call us",
    value: "1800-200-247",
    sub: "Available 24/7",
    href: "tel:18002000247",
  },
  {
    icon: MessageSquareText,
    tint: EMERALD,
    label: "Chat with AI",
    value: "Replies in seconds",
    sub: "Get instant answers",
    href: "/book",
  },
  {
    icon: Mail,
    tint: VIOLET,
    label: "Email",
    value: "care@24x7services.in",
    sub: "We'll get back to you",
    href: "mailto:care@24x7services.in",
  },
];

const ASSURANCES = [
  { icon: BadgeCheck, title: "Certified Experts", desc: "Background verified professionals" },
  { icon: PackageCheck, title: "Genuine Parts", desc: "100% original & brand approved" },
  { icon: ShieldCheck, title: "90-Day Warranty", desc: "Complete peace of mind" },
  { icon: Users, title: "Trusted by 50,000+", desc: "Happy customers across Telangana" },
];

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-28 pb-14 pt-12 sm:pb-20 sm:pt-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-white via-surface to-[#eaeefb] px-6 py-10 shadow-premium-lg sm:rounded-[2.5rem] sm:px-12 sm:py-14">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-28 size-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,71,208,0.22), transparent 62%)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 right-1/3 size-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(11,154,99,0.12), transparent 65%)" }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
            {/* ---------- pitch ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="relative"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-3.5 py-2 shadow-premium-sm">
                <span className="grid size-5 place-items-center rounded-full bg-royal-bright text-white">
                  <ShieldCheck className="size-3" strokeWidth={2.4} />
                </span>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-royal-bright">
                  We&apos;re here to help
                </span>
              </span>

              <h2 className="font-display mt-6 text-[2.6rem] leading-[0.98] tracking-[-0.03em] sm:text-[3.8rem]">
                Let&apos;s get it
                <br />
                <span className="italic text-royal-bright">fixed.</span>
              </h2>

              <span aria-hidden className="mt-5 block h-1 w-14 rounded-full bg-royal-bright" />

              <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                A certified expert, genuine parts and a 90-day warranty are 60 seconds away.
                Book now — or reach us however you like.
              </p>

              <Link
                href="/book"
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-royal-bright px-7 py-4 text-[0.95rem] font-semibold text-white shadow-[0_18px_40px_-14px_rgba(37,71,208,0.65)] transition-transform hover:scale-[1.02]"
              >
                <CalendarDays className="size-[1.1rem]" strokeWidth={1.9} />
                Book a service
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              {/* shield mark, tucked beside the copy once there is room */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/work/promise-shield-cut.png"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -bottom-4 right-0 hidden w-52 opacity-90 xl:block"
              />
            </motion.div>

            {/* ---------- channels ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.12, ease }}
              className="space-y-3 rounded-[1.5rem] border border-white/60 bg-white/55 p-3 shadow-premium-md backdrop-blur sm:rounded-[1.75rem] sm:p-4"
            >
              {CHANNELS.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="group flex items-center gap-4 rounded-2xl border border-white/70 bg-white p-4 shadow-premium-sm transition-transform duration-500 hover:-translate-y-0.5 sm:gap-5 sm:p-5"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-105 sm:size-14"
                    style={{ background: `${c.tint}16`, color: c.tint }}
                  >
                    <c.icon className="size-6" strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0 flex-1 leading-none">
                    <span
                      className="block text-[0.65rem] font-bold uppercase tracking-[0.16em]"
                      style={{ color: c.tint }}
                    >
                      {c.label}
                    </span>
                    <span className="mt-2 block truncate text-[1.05rem] font-semibold tracking-tight sm:text-[1.15rem]">
                      {c.value}
                    </span>
                    <span className="mt-2 block text-[0.78rem] text-muted">{c.sub}</span>
                  </span>

                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-11"
                    style={{ background: `${c.tint}14`, color: c.tint }}
                  >
                    <ArrowUpRight className="size-5" />
                  </span>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* ---------- assurance strip ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="relative mt-8 grid grid-cols-1 gap-6 rounded-[1.5rem] border border-white/60 bg-white/70 px-5 py-6 shadow-premium-sm backdrop-blur sm:grid-cols-2 sm:px-7 lg:grid-cols-4 lg:divide-x lg:divide-hairline"
          >
            {ASSURANCES.map((a) => (
              <div key={a.title} className="flex items-center gap-3.5 lg:justify-center lg:px-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-royal-bright/10 text-royal-bright">
                  <a.icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block text-[0.88rem] font-semibold tracking-tight">{a.title}</span>
                  <span className="mt-1.5 block text-[0.75rem] leading-snug text-muted">{a.desc}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
