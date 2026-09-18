"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, Check, ShoppingBag, Wrench, PackageOpen, ShieldCheck, Zap,
  type LucideIcon,
} from "lucide-react";

import { Kicker } from "./TextReveal";
import { AddToCart } from "./AddToCart";
import { ServiceSheet } from "./ServiceSheet";
import { ApplianceTile, BrandMark, problemIcon } from "@/components/ui/Icons";
import { useServices } from "@/components/providers/ServicesProvider";
import { useBrands } from "@/components/providers/BrandsProvider";
import {
  bandFor,
  brandsFor,
  repairsFor,
  type CatalogueService,
  type ServiceProblem,
} from "@/lib/catalogue-shared";
import { AMC_PLANS } from "@/lib/data";
import { cartTotal, openCart, useCart, type CartItem } from "@/lib/cart";
import type { ServiceIndexCopy } from "@/lib/service-index-shared";
import type { Service } from "@/lib/services";
import type { BrandId } from "@/lib/types";
import { cn, formatINR, formatRange } from "@/lib/utils";

/**
 * The service catalogue on /services.
 *
 * It replaced an editorial index — eight serif headlines that opened an
 * accordion — because that shape could only ever name a service. Somebody
 * arriving with a fridge that has stopped cooling wants the fault, the band it
 * costs, and a way to put it in the basket without reading the page first, and
 * a marketplace list is the shape that carries all three at once.
 *
 * Two admin surfaces feed it and both keep their meaning:
 *
 *  - the *service index* supplies the categories — their order, their titles,
 *    their photographs, and which of them are hidden.
 *  - the *catalogue* supplies the rows inside an appliance category: the
 *    faults, their bands, and what each make is charged for them.
 *
 * So a category is what an admin says it is, and a row is what the catalogue
 * says it is, and neither is written twice.
 */

/** What every repair carries, said on the row rather than a page away. */
const REPAIR_BULLETS = [
  "Free diagnosis, then an exact quote",
  "Genuine parts · 90-day warranty",
];

/** A face and a colour for the categories that are not an appliance. */
const CARE_ICON: Record<string, LucideIcon> = {
  installation: Wrench,
  uninstallation: PackageOpen,
  amc: ShieldCheck,
  emergency: Zap,
};
const CARE_ACCENT: Record<string, string> = {
  installation: "#2547d0",
  uninstallation: "#6d5ae0",
  amc: "#0b9a63",
  emergency: "#d9821b",
};
const CARE_FALLBACK_ACCENT = "#64748b";

/**
 * A photograph per row.
 *
 * There is no shot of "ice build-up" and inventing one would be a picture of
 * something we have not done — so a category's own gallery is dealt round its
 * rows. Neighbouring rows differ, which is what stops the list reading as one
 * repeated thumbnail.
 */
const ROW_SHOTS: Record<string, string[]> = {
  refrigerator: ["/work/gallery/fridge-1.png", "/work/gallery/fridge-2.png"],
  "washing-machine": [
    "/work/gallery/washing-1.png",
    "/work/gallery/washing-2.png",
    "/work/gallery/washing-3.webp",
  ],
  microwave: ["/work/gallery/microwave-1.png", "/work/gallery/microwave-2.png"],
  ac: ["/work/gallery/ac-1.png", "/work/gallery/ac-3.png", "/work/gallery/ac-2.png"],
};

function shotFor(applianceId: string, i: number, fallback?: string): string | undefined {
  const pool = ROW_SHOTS[applianceId];
  if (!pool?.length) return fallback;
  return pool[i % pool.length];
}

function bookHref(appliance: string, problem?: string, brand?: BrandId | null): string {
  const params = new URLSearchParams({ appliance });
  if (problem) params.set("problem", problem);
  if (brand) params.set("brand", brand);
  return `/book?${params.toString()}`;
}

type Row = {
  key: string;
  /** The word above the title — Repair, Care, Plan. */
  kind: string;
  title: string;
  popular?: boolean;
  rating?: number;
  bookings?: string;
  priceLabel: string;
  eta: string;
  image?: string;
  icon?: LucideIcon;
  bullets: string[];
  /** Absent when there is no single number to put in a basket. */
  cart?: CartItem;
  href: string;
};

type Category = {
  id: string;
  /** What the tile says — short enough for a 100px tile. */
  label: string;
  /** What the section heading says. */
  title: string;
  desc: string;
  /** The catalogue entry behind it, when the category is an appliance. */
  service?: CatalogueService;
  image?: string;
  rows: Row[];
};

/** "Emergency Repair" is a heading; "Emergency" is a tile. */
function tileLabel(row: Service, service?: CatalogueService): string {
  if (service) return service.name;
  return row.title.replace(/\s+Repair$/i, "");
}

function buildCategories(
  index: Service[],
  catalogue: CatalogueService[],
  brand: BrandId | null,
): Category[] {
  const byId = new Map(catalogue.map((s) => [s.id, s]));
  const out: Category[] = [];

  for (const row of index) {
    const service = row.appliance ? byId.get(row.appliance) : undefined;

    // ---- an appliance: its faults are the rows ----
    if (service) {
      // An appliance we are not authorised for on the chosen make has nothing
      // to show under it, so the whole category steps aside rather than
      // standing there empty.
      if (brand && !brandsFor(service).includes(brand)) continue;

      const repairs = repairsFor(service, brand ?? undefined);
      out.push({
        id: row.id,
        label: tileLabel(row, service),
        title: row.title,
        desc: row.desc,
        service,
        image: row.image,
        rows: repairs.map((p, i) => {
          const band = bandFor(service, p, brand ?? undefined);
          return {
            key: `${service.id}-${p.id}`,
            kind: "Repair",
            title: p.label,
            popular: p.common,
            rating: service.rating,
            bookings: service.bookings,
            priceLabel: formatRange(band[0], band[1]),
            eta: p.eta,
            image: shotFor(service.id, i, row.image),
            icon: problemIcon(p.id),
            bullets: REPAIR_BULLETS,
            // The band is a band; a basket line has to carry one figure, so it
            // carries the one the band starts at — the same rule the price
            // list has always used.
            cart: {
              id: service.id,
              name: service.name,
              qty: 1,
              price: band[0],
              problem: p.id,
              problemLabel: p.label,
              ...(brand ? { brand } : {}),
            },
            href: bookHref(service.id, p.id, brand),
          };
        }),
      });
      continue;
    }

    // ---- the annual contracts are their own rows ----
    if (row.id === "amc") {
      out.push({
        id: row.id,
        label: tileLabel(row),
        title: row.title,
        desc: row.desc,
        image: row.image,
        rows: AMC_PLANS.map((plan) => ({
          key: `amc-${plan.id}`,
          kind: "Plan",
          title: `${plan.name} plan`,
          popular: plan.highlight,
          priceLabel: `${formatINR(plan.price)} ${plan.period}`,
          eta: "12 months",
          image: row.image,
          icon: CARE_ICON.amc,
          bullets: plan.perks.slice(0, 2),
          cart: { id: plan.id, name: `${plan.name} plan`, qty: 1, price: plan.price, kind: "plan" },
          href: `/book?amc=${plan.id}`,
        })),
      });
      continue;
    }

    // ---- a care service the appliances are priced for ----
    // Installation is not one job at one price: an AC takes two hours and a
    // microwave forty minutes, and both numbers are already in the catalogue
    // under this id. So the category is one row per appliance that has it.
    const across = catalogue
      .filter((s) => !brand || brandsFor(s).includes(brand))
      .map((s) => ({ s, p: repairsFor(s, brand ?? undefined).find((p) => p.id === row.id) }))
      .filter((x): x is { s: CatalogueService; p: ServiceProblem } => Boolean(x.p));

    if (across.length) {
      out.push({
        id: row.id,
        label: tileLabel(row),
        title: row.title,
        desc: row.desc,
        image: row.image,
        rows: across.map(({ s, p }, i) => {
          const band = bandFor(s, p, brand ?? undefined);
          return {
            key: `${row.id}-${s.id}`,
            kind: "Care",
            title: `${s.name} ${row.title.toLowerCase()}`,
            rating: s.rating,
            bookings: s.bookings,
            priceLabel: formatRange(band[0], band[1]),
            eta: p.eta,
            image: shotFor(s.id, i, row.image),
            icon: CARE_ICON[row.id] ?? problemIcon(p.id),
            bullets: row.tags.length ? row.tags.slice(0, 2) : REPAIR_BULLETS,
            cart: {
              id: s.id,
              name: s.name,
              qty: 1,
              price: band[0],
              problem: p.id,
              problemLabel: p.label,
              ...(brand ? { brand } : {}),
            },
            href: bookHref(s.id, p.id, brand),
          };
        }),
      });
      continue;
    }

    // ---- everything else is the index row itself ----
    // Its price is a phrase rather than a number — "express +₹199" — and a
    // phrase cannot be added to a basket, so this row books instead.
    out.push({
      id: row.id,
      label: tileLabel(row),
      title: row.title,
      desc: row.desc,
      image: row.image,
      rows: [
        {
          key: row.id,
          kind: row.kind === "repair" ? "Repair" : "Care",
          // Not the category's own title — it is already the heading two
          // centimetres above, and printing it twice says nothing the second
          // time. This category exists precisely because no appliance carries
          // a price for it, which is what "any appliance" means here.
          title: "Any appliance",
          priceLabel: row.price,
          eta: row.eta,
          image: row.image,
          icon: CARE_ICON[row.id] ?? Wrench,
          bullets: row.tags.slice(0, 2),
          href: "/book",
        },
      ],
    });
  }

  return out;
}

/** The hash, as a store — so the category can be derived from it, not synced to it. */
function useHash(): string {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash,
    () => "",
  );
}

export function ServiceCatalogue({ index, copy }: { index: Service[]; copy: ServiceIndexCopy }) {
  const catalogue = useServices();
  const brands = useBrands();
  const [brand, setBrand] = useState<BrandId | null>(null);
  const [sheet, setSheet] = useState<CatalogueService | null>(null);
  const hash = useHash();

  const categories = useMemo(
    () => buildCategories(index, catalogue, brand),
    [index, catalogue, brand],
  );

  /**
   * Which category is open.
   *
   * The footer points at `/services#service-refrigerator`, so the hash has to
   * be able to choose one. A press stored on its own would then win forever —
   * follow a footer link from this very page and the hash would change under a
   * choice that no longer applies. Storing the hash the press was made against
   * settles it without an effect: a new hash simply stops matching.
   */
  const [picked, setPicked] = useState<{ id: string; hash: string } | null>(null);
  const fromHash = hash.startsWith("#service-") ? hash.slice("#service-".length) : null;
  const active =
    (picked?.hash === hash ? categories.find((c) => c.id === picked.id) : undefined) ??
    categories.find((c) => c.id === fromHash) ??
    categories[0];

  const choose = (id: string) => setPicked({ id, hash });
  const brandName = brands.find((b) => b.id === brand)?.name;

  return (
    <section id="services" className="relative scroll-mt-28 py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        {/* ---------- words ---------- */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>{copy.kicker}</Kicker>
            <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.15] tracking-[-0.03em] sm:text-6xl sm:leading-[1.05]">
              {copy.headline}
              {copy.headlineAccent && (
                <>
                  <br />
                  <span className="italic text-muted">{copy.headlineAccent}</span>
                </>
              )}
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-muted md:text-right">{copy.intro}</p>
        </div>

        {/* ---------- the make, which is what the prices are for ---------- */}
        <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:mt-10">
          <span className="mr-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
            Prices for
          </span>
          <button
            type="button"
            onClick={() => setBrand(null)}
            aria-pressed={brand === null}
            className={cn(
              "rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-colors",
              brand === null
                ? "border-transparent bg-ink text-background"
                : "border-border bg-card text-muted hover:text-ink",
            )}
          >
            All makes
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBrand(b.id)}
              aria-pressed={brand === b.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 transition-colors",
                brand === b.id
                  ? "border-transparent bg-ink"
                  : "border-border bg-card hover:border-border-strong",
              )}
            >
              {/* The wordmark sits on white in both themes, the way it does
                  everywhere else on the site — a brand colour on a dark pill
                  is not that brand's colour. */}
              <span className="inline-flex h-5 items-center rounded bg-white px-1.5 ring-1 ring-black/5">
                <BrandMark
                  id={b.id}
                  name={b.name}
                  accent={b.accent}
                  tone="brand"
                  className={b.id === "lg" ? "text-sm" : "text-[0.5rem]"}
                />
              </span>
              <span
                className={cn(
                  "text-[0.8rem] font-medium",
                  brand === b.id ? "text-background" : "text-muted",
                )}
              >
                {b.name}
              </span>
            </button>
          ))}
        </div>

        {/* Anchors for every category, not just the open one: the footer links
            at a service by name and the browser has to find it whether or not
            that category happens to be the one on screen. `sr-only` takes them
            out of flow, so they sit above the grid without being in it. */}
        {categories.map((c) => (
          <span key={`anchor-${c.id}`} id={`service-${c.id}`} className="sr-only scroll-mt-28" />
        ))}

        <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[17rem_1fr] lg:gap-12">
          {/* phones: a grid of tiles — every category visible at once rather
              than a strip that hides half of them off the right edge */}
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:hidden">
            {categories.map((c) => (
              <CategoryTile
                key={c.id}
                category={c}
                active={active?.id === c.id}
                onSelect={() => choose(c.id)}
              />
            ))}
          </div>

          {/* desktop: the list stays beside the rows and follows the scroll */}
          <nav aria-label="Service categories" className="hidden lg:block">
            <ul className="sticky top-28 space-y-1">
              {categories.map((c) => {
                const on = active?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => choose(c.id)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                        on
                          ? "bg-royal-bright/[0.08] text-ink"
                          : "text-muted hover:bg-surface-2/60 hover:text-ink",
                      )}
                    >
                      <CategoryGlyph category={c} className="size-10 rounded-xl" />
                      <span className="min-w-0 flex-1 text-[0.92rem] font-medium leading-tight">
                        {c.label}
                      </span>
                      <span className="shrink-0 text-[0.72rem] tabular-nums text-muted-2">
                        {c.rows.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ---------- rows ---------- */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id + (brand ?? "")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                >
                  <CategoryHeader
                    category={active}
                    brand={brand}
                    brandName={brandName}
                    /* Not gated on the service having extra fields filled in:
                       even bare, the sheet carries the photograph, what the
                       visit takes, what each make starts at, and an Add for
                       the whole service — none of which is on the rows. */
                    onDetails={
                      active.service ? () => setSheet(active.service ?? null) : undefined
                    }
                  />

                  <ul className="mt-2">
                    {active.rows.map((row) => (
                      <ServiceRow key={row.key} row={row} />
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ServiceSheet
        service={sheet}
        photo={sheet ? categories.find((c) => c.service?.id === sheet.id)?.image : undefined}
        onClose={() => setSheet(null)}
      />
      <CatalogueDock />
    </section>
  );
}

/** The appliance's own tile, or a flat accent square for a care category. */
function CategoryGlyph({ category, className }: { category: Category; className?: string }) {
  if (category.service) {
    return <ApplianceTile id={category.service.id} size="sm" className={className} />;
  }
  const Icon = CARE_ICON[category.id] ?? Wrench;
  const tint = CARE_ACCENT[category.id] ?? CARE_FALLBACK_ACCENT;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl", className)}
      style={{ background: `${tint}1f`, color: tint }}
    >
      <Icon className="size-5" strokeWidth={1.7} />
    </span>
  );
}

function CategoryTile({
  category,
  active,
  onSelect,
}: {
  category: Category;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-1.5 py-3 text-center transition-all",
        active
          ? "border-royal-bright/40 bg-royal-bright/[0.07] shadow-premium-sm"
          : "border-card-edge bg-card hover:-translate-y-0.5",
      )}
    >
      <CategoryGlyph category={category} className="size-11 rounded-xl" />
      <span
        className={cn(
          "text-[0.7rem] font-medium leading-tight tracking-tight",
          active ? "text-ink" : "text-muted",
        )}
      >
        {category.label}
      </span>
    </button>
  );
}

function CategoryHeader({
  category,
  brand,
  brandName,
  onDetails,
}: {
  category: Category;
  brand: BrandId | null;
  brandName?: string;
  /** Opens the sheet. Absent when the catalogue has nothing more to say. */
  onDetails?: () => void;
}) {
  const s = category.service;
  return (
    <header className="border-b border-hairline pb-5">
      <h3 className="font-display text-[1.6rem] leading-tight tracking-[-0.02em] sm:text-[2.1rem]">
        {category.title}
      </h3>
      <p className="mt-2 max-w-xl text-pretty text-[0.9rem] leading-relaxed text-muted">
        {category.desc}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.78rem] text-muted">
        {s && (
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-3.5 fill-amber text-amber" />
            <span className="font-semibold text-ink">{s.rating}</span> · {s.bookings} booked
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-royal-bright" /> {s?.serviceTime ?? category.rows[0]?.eta}
        </span>
        {/* Which makes this is priced for — the question that decides whether
            the numbers underneath apply to the machine in the kitchen. */}
        <span>{brand ? `Priced for ${brandName ?? brand}` : "Samsung, LG, IFB & Bosch"}</span>
        {s?.variants?.length ? <span className="text-muted-2">{s.variants.join(" · ")}</span> : null}
      </div>
      {/* One link, not one per row. What the sheet holds — the quantity tiers,
          what the visit covers, the questions — is true of the service, and a
          "View details" on every fault opened the same panel eight times. */}
      {onDetails && (
        <button
          type="button"
          onClick={onDetails}
          className="-mb-1.5 mt-3 inline-flex items-center gap-1 py-2 text-[0.82rem] font-semibold text-royal-bright hover:underline"
        >
          View service details
        </button>
      )}
    </header>
  );
}

function ServiceRow({ row }: { row: Row }) {
  const Icon = row.icon;
  return (
    <li className="flex gap-4 border-b border-hairline py-5 last:border-b-0 sm:gap-6 sm:py-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-2">
            {row.kind}
          </span>
          {row.popular && (
            <span className="rounded-full bg-royal-bright/12 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-royal-bright">
              Popular
            </span>
          )}
        </div>

        <h4 className="mt-1.5 text-[1.02rem] font-semibold leading-snug tracking-tight sm:text-[1.15rem]">
          {row.title}
        </h4>

        {row.rating !== undefined && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] text-muted">
            <Star className="size-3.5 fill-amber text-amber" />
            <span className="font-semibold text-ink">{row.rating}</span>
            {row.bookings && <span>({row.bookings} booked)</span>}
          </p>
        )}

        <p className="mt-1.5 text-[0.88rem] font-bold tracking-tight">
          {row.priceLabel}
          <span className="ml-2 text-[0.78rem] font-normal text-muted">· {row.eta}</span>
        </p>

        {/* the short rule under the price is what separates the offer from
            what it includes, the way a menu separates a dish from its garnish */}
        <span aria-hidden className="my-3 block h-px max-w-[20rem] bg-hairline" />

        <ul className="space-y-1.5">
          {row.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[0.78rem] leading-snug text-muted">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald" strokeWidth={2.4} />
              {b}
            </li>
          ))}
        </ul>

        {/* Straight to the form with this fault already chosen — the basket
            is the other route, not the only one. */}
        <Link
          href={row.href}
          className="-mb-1.5 mt-2 inline-flex items-center gap-1 py-2 text-[0.8rem] font-semibold text-royal-bright hover:underline"
        >
          Book this
        </Link>
      </div>

      <div className="w-[106px] shrink-0 sm:w-[140px]">
        {row.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={row.image}
            alt=""
            loading="lazy"
            className="h-[88px] w-full rounded-2xl object-cover sm:h-[112px]"
          />
        ) : (
          <div className="grid h-[88px] w-full place-items-center rounded-2xl bg-surface-2 sm:h-[112px]">
            {Icon ? <Icon className="size-6 text-muted-2" strokeWidth={1.6} /> : null}
          </div>
        )}

        {/* The button laps the foot of the photograph — the basket control is
            the one thing on the row that has to be found without reading it.
            Its background lives on this wrapper rather than on the button, so
            the button keeps its own two states: a royal outline to add, an
            emerald fill once it is in. */}
        {row.cart ? (
          <div className="relative -mt-5 rounded-full bg-card shadow-premium-sm">
            <AddToCart item={row.cart} variant="outline" className="w-full" />
          </div>
        ) : (
          <Link
            href={row.href}
            className="relative -mt-5 flex w-full items-center justify-center rounded-full border border-royal-bright bg-card px-3.5 py-2.5 text-xs font-semibold text-royal-bright shadow-premium-sm transition-colors hover:bg-royal-bright hover:text-white"
          >
            Book
          </Link>
        )}
      </div>
    </li>
  );
}

/**
 * The basket, docked to the foot of the page.
 *
 * It publishes its own height as `--dock-h` so whatever else lives down there
 * can step over it — the chat button does — instead of the two of them sharing
 * the same corner and one covering the other.
 */
function CatalogueDock() {
  const items = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);

  useEffect(() => {
    if (!count) return;
    const root = document.documentElement;
    root.style.setProperty("--dock-h", "4.75rem");
    return () => {
      root.style.removeProperty("--dock-h");
    };
  }, [count]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[65] border-t border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_34px_-20px_rgba(23,21,15,0.45)] backdrop-blur-xl sm:px-6"
        >
          <div className="mx-auto flex max-w-[92rem] items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-royal-bright/10 text-royal-bright">
              <ShoppingBag className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1 leading-none">
              <p className="text-[0.85rem] font-semibold tracking-tight">
                {count} {count === 1 ? "service" : "services"} in basket
              </p>
              <p className="mt-1.5 text-[0.75rem] text-muted">from {formatINR(cartTotal(items))}</p>
            </div>
            <button
              type="button"
              onClick={openCart}
              className="shrink-0 rounded-full bg-ink px-5 py-3 text-[0.85rem] font-semibold text-background transition-transform hover:scale-[1.02]"
            >
              View basket
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
