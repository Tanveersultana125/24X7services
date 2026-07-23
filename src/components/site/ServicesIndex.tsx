"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Wrench, Clock, Sparkles, Settings2, PackageOpen, CalendarHeart, Siren } from "lucide-react";
import { Kicker } from "./TextReveal";
import { ApplianceTile } from "@/components/ui/Icons";
import { SERVICES, type Service } from "@/lib/services";
import { cn } from "@/lib/utils";

const CARE_ICONS: Record<string, typeof Settings2> = {
  installation: Settings2,
  uninstallation: PackageOpen,
  amc: CalendarHeart,
  emergency: Siren,
};

export function ServicesIndex() {
  const [active, setActive] = useState(0);
  const svc = SERVICES[active];

  return (
    <section id="services" className="relative scroll-mt-28 pb-14 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>The work</Kicker>
            <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Eight services.
              <br />
              <span className="italic text-muted">One standard.</span>
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-muted md:text-right">
            Every job — from a quick microwave fix to a full annual contract — held to the
            same obsessive bar.
          </p>
        </div>

        <div className="mt-10 sm:mt-16 grid gap-12 lg:grid-cols-12">
          {/* Index list */}
          <ol className="lg:col-span-7">
            {SERVICES.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={s.appliance ? `/book?appliance=${s.appliance}` : "/book"}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={cn(
                    "group flex items-center gap-5 border-b border-hairline py-6 transition-colors sm:gap-8",
                    active === i ? "text-ink" : "text-muted"
                  )}
                >
                  <span className="w-10 shrink-0 font-mono text-sm tabular-nums">{s.no}</span>
                  <span className="font-display flex-1 text-2xl tracking-[-0.02em] transition-transform duration-500 group-hover:translate-x-2 sm:text-[2.1rem]">
                    {s.title}
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:block">{s.price}</span>
                  <ArrowUpRight
                    className={cn(
                      "size-6 shrink-0 transition-all duration-500",
                      active === i ? "translate-x-0 translate-y-0 opacity-100 text-royal-bright" : "-translate-x-2 translate-y-2 opacity-0"
                    )}
                  />
                </Link>
              </li>
            ))}
          </ol>

          {/* Sticky preview */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative overflow-hidden rounded-[2rem] border border-border bg-surface shadow-premium-lg"
                >
                  <Preview svc={svc} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Preview({ svc }: { svc: Service }) {
  const CareIcon = CARE_ICONS[svc.id] ?? Sparkles;
  return (
    <div className="relative">
      {/* photo band — the service's own work, fading into the card surface */}
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svc.image}
          alt={svc.title}
          className="size-full object-cover object-center transition-transform duration-[1.4s] ease-out"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(23,21,15,0.18) 0%, rgba(23,21,15,0.04) 40%, var(--surface) 100%)",
          }}
        />
        <span className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink backdrop-blur">
          {svc.kind}
        </span>
      </div>

      <div className="relative -mt-9 px-8 pb-8">
        {svc.appliance ? (
          <ApplianceTile id={svc.appliance} size="lg" />
        ) : (
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-royal-bright to-royal text-white shadow-premium-md">
            <CareIcon className="size-8" strokeWidth={1.6} />
          </span>
        )}

        <h3 className="font-display mt-5 text-3xl tracking-[-0.02em]">{svc.title}</h3>
        <p className="mt-3 text-pretty leading-relaxed text-muted">{svc.desc}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {svc.tags.map((t) => (
            <span key={t} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-6 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Wrench className="size-4 text-royal-bright" /> {svc.price}
          </span>
          <span className="flex items-center gap-2 text-muted">
            <Clock className="size-4 text-emerald" /> {svc.eta}
          </span>
        </div>
      </div>
    </div>
  );
}
