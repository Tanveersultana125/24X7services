"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, Clock, Receipt, ShieldCheck } from "lucide-react";
import { ApplianceTile, problemIcon } from "@/components/ui/Icons";
import { bandFor, priceFor, repairsFor, type CatalogueService } from "@/lib/catalogue-shared";
import { formatINR, formatRange } from "@/lib/utils";
import type { Brand } from "@/lib/types";
import { Kicker } from "./TextReveal";

const ease = [0.16, 1, 0.3, 1] as const;

/** Rows shown before the panel asks to be opened. */
const PREVIEW = 5;

/**
 * What each appliance can actually be booked for on this make, and what it
 * costs.
 *
 * The cards above answer "do you repair Samsung fridges"; this answers the
 * question that follows it, which is the one that decides whether anybody
 * calls. Every band comes from `bandFor`, so a part priced for Samsung is the
 * figure a Samsung visitor is shown — the catalogue already keeps prices per
 * make, and printing the shared band here would quietly contradict the
 * booking form.
 */
export function BrandRepairs({ brand, services }: { brand: Brand; services: CatalogueService[] }) {
  if (services.length === 0) return null;

  return (
    <section className="relative border-t border-hairline py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>{brand.name} price list</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.15] tracking-[-0.03em] sm:text-5xl sm:leading-[1.05]">
          Every {brand.name} repair, priced.
        </h2>
        <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted">
          Bands for {brand.name} parts and {brand.name} labour. The technician confirms the
          exact figure at your door, before any work starts.
        </p>

        <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-2">
          {services.map((service, i) => (
            <RepairPanel key={service.id} brand={brand} service={service} index={i} />
          ))}
        </div>

        <p className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Receipt className="size-4 text-muted-2" />
          Diagnosis is free, and the itemised GST invoice is sent the moment the job closes.
        </p>
      </div>
    </section>
  );
}

function RepairPanel({
  brand,
  service,
  index,
}: {
  brand: Brand;
  service: CatalogueService;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const repairs = repairsFor(service, brand.id);
  const shown = open ? repairs : repairs.slice(0, PREVIEW);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease }}
      className="flex flex-col overflow-hidden rounded-[1.75rem] border border-card-edge bg-card shadow-[0_18px_40px_-22px_rgba(23,21,15,0.18),inset_0_1.5px_0_var(--card-edge)] dark:border-white/[0.12] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center gap-3.5 border-b border-hairline px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <ApplianceTile id={service.id} size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-lg tracking-[-0.02em] sm:text-xl">
            {brand.name} {service.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span>{repairs.length} repairs covered</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-muted-2" /> {service.serviceTime}
            </span>
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">From</span>
          <span className="font-display text-lg tracking-tight sm:text-xl">
            {formatINR(priceFor(service, brand.id))}
          </span>
        </span>
      </div>

      <ul className="divide-y divide-hairline">
        {shown.map((p) => {
          const Glyph = problemIcon(p.id);
          const [min, max] = bandFor(service, p, brand.id);
          return (
            <li key={p.id}>
              <Link
                href={`/book?brand=${brand.id}&appliance=${service.id}&problem=${p.id}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50 sm:gap-3.5 sm:px-6 sm:py-3.5"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg sm:size-9"
                  style={{
                    color: brand.accent,
                    background: `color-mix(in srgb, ${brand.accent} 10%, transparent)`,
                  }}
                >
                  <Glyph className="size-4" strokeWidth={1.9} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[0.88rem] font-medium leading-snug">{p.label}</span>
                    {p.common && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
                        style={{
                          color: brand.accent,
                          background: `color-mix(in srgb, ${brand.accent} 12%, transparent)`,
                        }}
                      >
                        COMMON
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-muted-2">
                    <Clock className="size-3" /> {p.eta}
                  </span>
                </span>

                {/* The band is the reason the row exists, so it keeps its
                    width and the label wraps instead. */}
                <span className="shrink-0 text-right text-[0.76rem] font-semibold tabular-nums text-ink sm:text-sm">
                  {formatRange(min, max)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* A panel of eight rows beside one of five made the grid ragged, so each
          opens on demand and they start the same height. */}
      {repairs.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center justify-center gap-1.5 border-t border-hairline px-4 py-3.5 text-[0.8rem] font-medium text-muted transition-colors hover:bg-surface-2/50 hover:text-ink"
        >
          {open ? "Show fewer" : `Show all ${repairs.length} ${service.name.toLowerCase()} repairs`}
          <ChevronDown
            className={"size-4 transition-transform duration-300" + (open ? " rotate-180" : "")}
          />
        </button>
      )}

      <p className="mt-auto flex items-center gap-2 border-t border-hairline px-4 py-3.5 text-[0.72rem] text-muted-2 sm:px-6">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald" />
        Genuine {brand.name} parts, 90-day warranty on the repair.
      </p>
    </motion.div>
  );
}
