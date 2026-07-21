"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export function PageHeader({
  crumb,
  title,
  subtitle,
  stats,
  image,
}: {
  crumb: string;
  title: React.ReactNode;
  subtitle: string;
  stats?: { value: string; label: string }[];
  image?: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-hairline pt-36 pb-16 sm:pt-40 sm:pb-20">
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-royal-bright/8 blur-[120px]" />
      <div className="relative mx-auto max-w-[92rem] px-6 sm:px-10">
        {/* breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1.5 text-sm text-muted"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-ink">Home</Link>
          <ChevronRight className="size-3.5 text-muted-2" />
          <span className="text-ink">{crumb}</span>
        </motion.nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <h1 className="font-display text-[3rem] leading-[1.02] tracking-[-0.03em] sm:text-[4.5rem]">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.1em]">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.9, ease }}
                >
                  {title}
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted"
            >
              {subtitle}
            </motion.p>

            {/* when an image is shown, stats sit under the copy as a row */}
            {image && stats && (
              <motion.dl
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-10 flex flex-wrap gap-x-10 gap-y-4"
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-3xl tracking-tight sm:text-4xl">{s.value}</dt>
                    <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>

          {image ? (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease }}
              className="relative flex justify-center lg:justify-end"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-royal-bright/15 blur-[90px]" />
              </div>
              <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border-[6px] border-white shadow-premium-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="24X7 certified technician on the job"
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>
            </motion.div>
          ) : (
            stats && (
              <motion.dl
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="grid grid-cols-3 gap-6 lg:justify-items-end"
              >
                {stats.map((s) => (
                  <div key={s.label} className="lg:text-right">
                    <dt className="font-display text-3xl tracking-tight sm:text-4xl">{s.value}</dt>
                    <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )
          )}
        </div>
      </div>
    </header>
  );
}
