"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Wrench, Clock, Sparkles, Settings2, PackageOpen, CalendarHeart, Siren, ChevronDown } from "lucide-react";
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
  const [active, setActive] = useState<number | null>(0);
  const svc = SERVICES[active ?? 0];

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

        <div className="mt-10 grid gap-12 sm:mt-16 lg:grid-cols-12">
          {/* Index list */}
          <ol className="lg:col-span-7">
            {SERVICES.map((s, i) => (
              <li key={s.id} className="border-b border-hairline">
                <Link
                  href={s.appliance ? `/book?appliance=${s.appliance}` : "/book"}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(i); }}
                  onFocus={() => setActive(i)}
                  onClick={(e) => {
                    // below lg the row is the accordion control, not the link — booking
                    // is the button inside the panel it opens. Keyed off width rather
                    // than hover support, so a narrow desktop window behaves the same.
                    // Tapping the open row again closes it.
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      e.preventDefault();
                      setActive((cur) => (cur === i ? null : i));
                    }
                  }}
                  className={cn(
                    "group flex items-center gap-4 py-5 transition-colors sm:gap-8 sm:py-6",
                    active === i ? "text-ink" : "text-muted"
                  )}
                >
                  <span className="w-8 shrink-0 font-mono text-xs tabular-nums sm:w-10 sm:text-sm">{s.no}</span>
                  <span className="font-display flex-1 text-[1.5rem] tracking-[-0.02em] transition-transform duration-500 group-hover:translate-x-2 sm:text-[2.1rem]">
                    {s.title}
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:block">{s.price}</span>
                  {/* the list is a menu on touch, so show open/closed state there */}
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 transition-transform duration-500 lg:hidden",
                      active === i ? "rotate-180 text-royal-bright" : "text-muted-2"
                    )}
                  />
                  <ArrowUpRight
                    className={cn(
                      "hidden size-6 shrink-0 transition-all duration-500 lg:block",
                      active === i
                        ? "translate-x-0 translate-y-0 text-royal-bright opacity-100"
                        : "-translate-x-2 translate-y-2 opacity-0"
                    )}
                  />
                </Link>

                {/* below lg the detail opens inline, right under the service tapped */}
                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden lg:hidden"
                    >
                      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-premium-md mb-6">
                        <Preview svc={s} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ol>

          {/* Sticky preview — desktop only */}
          <div className="hidden lg:col-span-5 lg:block">
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
      <div className="relative h-40 w-full overflow-hidden sm:h-52">
        {svc.image ? (
          <>
            {/* each shot frames its subject differently, so the crop point is per service */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={svc.image}
              alt={svc.title}
              style={{ objectPosition: svc.imagePos }}
              className="size-full object-cover transition-transform duration-[1.4s] ease-out"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(23,21,15,0.18) 0%, rgba(23,21,15,0.04) 40%, var(--surface) 100%)",
              }}
            />
          </>
        ) : (
          // no photo on file yet — an accent header reads as deliberate, a wrong photo does not
          <div
            aria-hidden
            className="size-full"
            style={{
              background:
                "radial-gradient(120% 120% at 20% 0%, rgba(37,71,208,0.22), transparent 60%), radial-gradient(100% 100% at 90% 10%, rgba(11,154,99,0.16), transparent 62%), linear-gradient(to bottom, var(--surface-2), var(--surface))",
            }}
          />
        )}
        <span className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink backdrop-blur">
          {svc.kind}
        </span>
      </div>

      <div className="relative -mt-9 px-6 pb-7 sm:px-8 sm:pb-8">
        {svc.appliance ? (
          <ApplianceTile id={svc.appliance} size="lg" />
        ) : (
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-royal-bright to-royal text-white shadow-premium-md">
            <CareIcon className="size-8" strokeWidth={1.6} />
          </span>
        )}

        <h3 className="font-display mt-5 text-[1.7rem] tracking-[-0.02em] sm:text-3xl">{svc.title}</h3>
        <p className="mt-3 text-pretty text-[0.92rem] leading-relaxed text-muted sm:text-base">{svc.desc}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {svc.tags.map((t) => (
            <span key={t} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-hairline pt-5 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Wrench className="size-4 text-royal-bright" /> {svc.price}
          </span>
          <span className="flex items-center gap-2 text-muted">
            <Clock className="size-4 text-emerald" /> {svc.eta}
          </span>
        </div>

        <Link
          href={svc.appliance ? `/book?appliance=${svc.appliance}` : "/book"}
          className="group mt-5 flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[0.9rem] font-medium text-background transition-transform hover:scale-[1.01]"
        >
          Book {svc.title.replace(" Repair", "").replace(" Service & Repair", "")}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
