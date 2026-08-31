"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, ChevronRight, Clock, PackageCheck, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import type { Brand } from "@/lib/types";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The header for one manufacturer's page.
 *
 * `PageHeader` serves the pages that stand for the whole company, where the
 * subject is us. Here the subject is the make the visitor arrived searching
 * for, and the first thing the page owes them is proof they landed on the
 * right one: the mark itself, in its own colour, with the word "authorised"
 * beside it. That is a different composition rather than a fifth variant of
 * one, so it is its own component and `PageHeader` keeps its four.
 *
 * The mark leads on a phone and follows on a laptop. Reading order and column
 * order disagree here on purpose: a narrow screen shows one thing at a time
 * and the logo answers "is this Samsung?", while a wide screen shows both at
 * once and the headline should hold the left edge as it does on every other
 * page of the site.
 */
export function BrandHeader({
  brand,
  services,
}: {
  brand: Brand;
  /** How many appliances we cover for this make — one of the three figures. */
  services: number;
}) {
  const stats = [
    { icon: PackageCheck, value: String(services), label: "Appliances covered" },
    { icon: ShieldCheck, value: "90 days", label: "Repair warranty" },
    { icon: Clock, value: "< 90 min", label: "Avg. arrival" },
  ];

  return (
    <header className="relative overflow-hidden border-b border-hairline pt-32 pb-14 sm:pt-40 sm:pb-20">
      {/* The page takes its light from the make it is about. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 size-[38rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-[120px]"
        style={{ background: brand.accent }}
      />

      <div className="relative z-10 mx-auto max-w-[92rem] px-6 sm:px-10">
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1.5 text-sm text-muted"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-ink">Home</Link>
          <ChevronRight className="size-3.5 text-muted-2" />
          <Link href="/brands" className="transition-colors hover:text-ink">Brands</Link>
          <ChevronRight className="size-3.5 text-muted-2" />
          <span className="text-ink">{brand.name}</span>
        </motion.nav>

        {/* 22rem rather than a fraction: the plate holds a wordmark, and a
            wordmark that grows with the viewport stops being a logo and starts
            being a second headline. */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease }}
            className="order-1 lg:order-2"
          >
            <BrandPlate brand={brand} />
          </motion.div>

          <div className="order-2 lg:order-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] ring-1 ring-inset"
              style={{
                color: brand.accent,
                background: `color-mix(in srgb, ${brand.accent} 10%, transparent)`,
                ["--tw-ring-color" as string]: `color-mix(in srgb, ${brand.accent} 24%, transparent)`,
              } as React.CSSProperties}
            >
              <BadgeCheck className="size-3.5" strokeWidth={2.2} />
              Authorised service partner
            </motion.span>

            <h1 className="font-display mt-5 text-[2.5rem] leading-[1.04] tracking-[-0.03em] sm:text-[4.5rem]">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.1em]">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.9, ease }}
                >
                  {brand.name} repair
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted"
            >
              Authorised {brand.name} service across Telangana — genuine {brand.name} parts,
              technicians trained on {brand.name} models, and a 90-day written warranty on
              every repair.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              /* Both actions share the row on a phone, as they do in the hero —
                 the pair is a little wider than a 400px column on its own. */
              className="mt-8 flex items-center gap-2.5 sm:flex-wrap sm:gap-3"
            >
              <Link
                href={`/book?brand=${brand.id}`}
                className="group inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-3.5 text-[0.85rem] font-semibold text-white transition-transform hover:scale-[1.02] sm:flex-none sm:px-7 sm:text-[0.95rem]"
                style={{
                  background: `linear-gradient(140deg, ${brand.accent}, color-mix(in srgb, ${brand.accent} 72%, #0b1020))`,
                  boxShadow: `0 16px 40px -14px color-mix(in srgb, ${brand.accent} 70%, transparent)`,
                }}
              >
                {/* Half a 390px row is not wide enough for the make and the
                    word repair both — and the make is already the loudest
                    thing on the screen by the time anyone reaches this. */}
                <span className="sm:hidden">Book repair</span>
                <span className="hidden sm:inline">Book {brand.name} repair</span>
                <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="#services"
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border-strong px-4 py-3.5 text-[0.85rem] font-medium text-ink transition-colors hover:bg-surface-2 sm:flex-none sm:px-7 sm:text-[0.95rem]"
              >
                What we repair
              </Link>
            </motion.div>
          </div>
        </div>

        {/* The figures sit under both columns rather than inside one. Held to
            the copy column they left the top-right of the page empty; given to
            the right column they collided with the plate. */}
        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease }}
          className="mt-10 grid grid-cols-3 rounded-[1.5rem] border border-card-edge bg-card/70 px-2 py-5 shadow-premium-sm backdrop-blur sm:mt-14 sm:px-6 lg:divide-x lg:divide-hairline"
        >
          {stats.map((s) => (
            <div key={s.label} className="px-1 text-center sm:px-4">
              <span
                className="mx-auto grid size-10 place-items-center rounded-full sm:size-12"
                style={{
                  color: brand.accent,
                  background: `color-mix(in srgb, ${brand.accent} 11%, transparent)`,
                }}
              >
                <s.icon className="size-5" strokeWidth={1.8} />
              </span>
              <dt className="font-display mt-3 text-xl tracking-tight sm:text-3xl">{s.value}</dt>
              <dd className="mt-1.5 text-[0.66rem] leading-snug text-muted sm:text-xs">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </header>
  );
}

/**
 * The mark on a white plate in both themes.
 *
 * A brand mark is fixed artwork — Samsung's navy on a near-black card reads as
 * a different, muddier logo, which is not ours to repaint. So the plate stays
 * white and the card around it carries the theme.
 */
function BrandPlate({ brand }: { brand: Brand }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-card-edge bg-card shadow-[0_22px_50px_-24px_rgba(23,21,15,0.28),inset_0_1.5px_0_var(--card-edge)] dark:border-white/[0.12] dark:shadow-[0_30px_70px_-34px_rgba(0,0,0,0.95)]">
      <div className="relative grid h-36 place-items-center bg-white sm:h-44">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: `radial-gradient(120% 90% at 70% 115%, ${brand.accent}, transparent 62%)` }}
        />
        <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-emerald ring-1 ring-inset ring-emerald/20">
          <BadgeCheck className="size-3" /> Authorised
        </span>
        {/* LG's identity is the face mark beside the letters, not a wordmark. */}
        {brand.id === "lg" ? (
          <span className="relative flex items-center gap-2.5">
            <BrandMark id="lg" tone="brand" className="text-3xl sm:text-4xl" />
            <span className="text-3xl font-extrabold tracking-tight text-muted sm:text-4xl">LG</span>
          </span>
        ) : (
          <BrandMark
            id={brand.id}
            name={brand.name}
            accent={brand.accent}
            tone="brand"
            className="relative text-xl sm:text-2xl"
          />
        )}
      </div>

      <div
        className="flex items-center gap-3 px-4 py-4 text-white"
        style={{
          background: `linear-gradient(160deg, ${brand.accent}, color-mix(in srgb, ${brand.accent} 72%, #0b1020))`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30">
          <ShieldCheck className="size-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 leading-none">
          <span className="block text-[0.9rem] font-semibold tracking-tight">{brand.name}</span>
          <span className="mt-1.5 block text-[0.68rem] leading-snug text-white/80">{brand.tagline}</span>
        </span>
      </div>
    </div>
  );
}
