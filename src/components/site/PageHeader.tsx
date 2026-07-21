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
    <header
      className={
        "relative overflow-hidden border-b border-hairline pt-36 pb-16 sm:pt-40 sm:pb-20" +
        (image ? " lg:min-h-[34rem]" : "")
      }
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-royal-bright/8 blur-[120px]" />

      {/* full-bleed technician image (desktop) — bleeds off the right, fades into the page */}
      {image && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 hidden size-[42rem] -translate-y-1/2 translate-x-1/5 rounded-full bg-royal-bright/12 blur-[120px] lg:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
            src={image}
            alt="24X7 certified technician on the job"
            className="pointer-events-none absolute right-0 top-1/2 hidden w-[56%] max-w-[50rem] -translate-y-1/2 [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_32%)] [mask-image:linear-gradient(to_right,transparent_0%,#000_32%)] lg:block"
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-[92rem] px-6 sm:px-10">
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

        <div className={image ? "mt-10 max-w-2xl" : "mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end"}>
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
                className="mt-12 flex flex-wrap gap-x-12 gap-y-4"
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

          {!image && stats && (
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
          )}
        </div>

        {/* stacked image on mobile */}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            aria-hidden
            className="mt-10 w-full rounded-2xl [-webkit-mask-image:linear-gradient(to_right,transparent,#000_18%)] [mask-image:linear-gradient(to_right,transparent,#000_18%)] lg:hidden"
          />
        )}
      </div>
    </header>
  );
}
