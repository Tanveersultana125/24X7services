"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, BadgeCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";

const ease = [0.16, 1, 0.3, 1] as const;

export function PageHeader({
  crumb,
  title,
  subtitle,
  stats,
  image,
  logos,
  collage,
}: {
  crumb: string;
  title: React.ReactNode;
  subtitle: string;
  stats?: { value: string; label: string }[];
  image?: string;
  logos?: boolean;
  collage?: string[];
}) {
  return (
    <header
      className={
        "relative overflow-hidden border-b border-hairline pt-36 pb-16 sm:pt-40 sm:pb-20" +
        (image ? " lg:min-h-[34rem]" : "")
      }
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-royal-bright/8 blur-[120px]" />

      {/* full-bleed technician image (desktop) — sits on a soft blue wash so it blends */}
      {image && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(105deg, transparent 40%, rgba(226,234,251,0.55) 64%, #e3ebfc 100%)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
            src={image}
            alt="24X7 certified technician on the job"
            className="pointer-events-none absolute bottom-0 right-0 hidden w-[46%] max-w-[40rem] object-contain object-bottom [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_38%)] [mask-image:linear-gradient(to_right,transparent_0%,#000_38%)] lg:block"
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

        <div className={image ? "mt-10 max-w-2xl" : "mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center"}>
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

            {/* when an image, logos, or collage are shown, stats sit under the copy as a row */}
            {(image || logos || collage) && stats && (
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

          {/* brand-logo cards on the right */}
          {!image && logos && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {BRANDS.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease }}
                  className="group relative grid h-28 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_14px_30px_-16px_rgba(23,21,15,0.18),inset_0_1.5px_0_rgba(255,255,255,0.9)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_46px_-20px_rgba(23,21,15,0.28)] sm:h-32"
                >
                  {/* brand-colour glow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                    style={{ background: b.accent }}
                  />
                  {/* authorised chip */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald/12 px-2 py-0.5 text-[0.58rem] font-semibold text-emerald">
                    <BadgeCheck className="size-3" /> Authorised
                  </span>
                  <BrandMark id={b.id} tone="brand" className="relative text-2xl" />
                  {/* animated accent line */}
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: b.accent }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* photo collage on the right */}
          {!image && collage && collage.length >= 4 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <CollageShot src={collage[0]} ratio="aspect-square" delay={0.25} />
                <CollageShot src={collage[1]} ratio="aspect-[4/5]" delay={0.4} />
              </div>
              <div className="flex flex-col gap-3 pt-8 sm:gap-4">
                <CollageShot src={collage[2]} ratio="aspect-[4/5]" delay={0.3} />
                <CollageShot src={collage[3]} ratio="aspect-square" delay={0.45} />
              </div>
            </div>
          )}

          {!image && !logos && !collage && stats && (
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

function CollageShot({ src, ratio, delay }: { src: string; ratio: string; delay: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`overflow-hidden rounded-2xl border border-white/70 shadow-premium-md ${ratio}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="24X7 technician on the job" className="h-full w-full object-cover" />
    </motion.figure>
  );
}
