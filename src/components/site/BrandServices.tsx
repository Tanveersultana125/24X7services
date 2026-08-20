"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, ShieldCheck, Clock, Star } from "lucide-react";
import { ApplianceTile, BrandMark } from "@/components/ui/Icons";
import { useSiteImages } from "@/components/providers/SiteImagesProvider";
import { priceFor, repairsFor, type CatalogueService } from "@/lib/catalogue-shared";
import { formatINR } from "@/lib/utils";
import type { Brand } from "@/lib/types";
import { Kicker } from "./TextReveal";
import { AddToCart } from "./AddToCart";

const ease = [0.16, 1, 0.3, 1] as const;

/** The photo each appliance already has elsewhere on the site. */
const SLOT: Record<string, string> = {
  refrigerator: "mostbooked-refrigerator",
  "washing-machine": "mostbooked-washing-machine",
  microwave: "mostbooked-microwave",
  ac: "mostbooked-ac-service",
};

/**
 * One manufacturer's services, a card each.
 *
 * A customer searching for their make wants to see their make: "Samsung
 * refrigerator service", not "refrigerator service, Samsung among others". The
 * cards are built from the same catalogue the panel edits, so the price shown
 * is the one set on that brand's page.
 */
export function BrandServices({ brand, services }: { brand: Brand; services: CatalogueService[] }) {
  const images = useSiteImages();

  return (
    <section id="services" className="relative scroll-mt-28 py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>{brand.name} service</Kicker>
        <h2 className="font-display mt-6 max-w-2xl text-[2.4rem] leading-[1.15] tracking-[-0.03em] sm:leading-[1.05] sm:text-5xl">
          What we repair for {brand.name}.
        </h2>
        <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted">
          {brand.tagline} — booked in a minute, with a 90-day warranty on every repair.
        </p>

        {services.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center text-muted">
            Nothing listed for {brand.name} yet.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((s, i) => {
              const photo = images[SLOT[s.id]];
              return (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-card-edge bg-gradient-to-b from-card to-surface p-5 shadow-[0_18px_40px_-20px_rgba(23,21,15,0.18),inset_0_1.5px_0_var(--card-edge)] transition-all duration-500 hover:-translate-y-1 dark:border-white/[0.12] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-surface-2">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={`${brand.name} ${s.name} service`}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <ApplianceTile id={s.id} size="lg" className="size-16" />
                    )}
                    {/* The mark rides the photograph so a card lifted out of
                        the page still says whose appliance it is. It keeps its
                        white plate in both themes — see BrandHeader. */}
                    <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-md bg-white px-2 shadow-premium-sm ring-1 ring-black/5">
                      <BrandMark
                        id={brand.id}
                        tone="brand"
                        className={brand.id === "lg" ? "text-base" : "text-[0.55rem]"}
                      />
                    </span>
                  </div>

                  <h3 className="font-display mt-5 text-pretty text-xl leading-tight tracking-[-0.02em]">
                    {brand.name} {s.name} Service
                  </h3>
                  <p className="mt-2.5 flex-1 text-pretty text-sm leading-relaxed text-muted">
                    {s.blurb}
                  </p>

                  <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">From {formatINR(priceFor(s, brand.id))}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-2" /> {s.serviceTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber text-amber" /> {s.rating}
                    </span>
                  </dl>

                  <p className="mt-2 text-xs text-muted-2">
                    {repairsFor(s, brand.id).length} repairs covered
                  </p>

                  <div className="mt-5 flex items-center gap-2.5">
                    <Link
                      href={`/book?brand=${brand.id}&appliance=${s.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
                    >
                      <Phone className="size-4" /> Book now
                    </Link>
                    {/* The make travels with the line: the price on this card
                        is Samsung's, and a basket that forgets whose fridge it
                        is sends the booking form back to asking. */}
                    <AddToCart
                      variant="icon"
                      className="size-11 sm:size-11"
                      item={{
                        id: s.id,
                        name: `${brand.name} ${s.name}`,
                        qty: 1,
                        price: priceFor(s, brand.id),
                        brand: brand.id,
                      }}
                    />
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        <p className="mt-8 flex items-center gap-2 text-sm text-muted">
          <ShieldCheck className="size-4 text-emerald" />
          Genuine {brand.name} parts, fitted by technicians trained on {brand.name} models.
        </p>
      </div>
    </section>
  );
}
