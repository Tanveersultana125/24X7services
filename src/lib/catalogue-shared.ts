import { APPLIANCES } from "./data";
import { BRANDS } from "./data";
import type { Appliance, BrandId, Problem } from "./types";

/**
 * The service catalogue the site actually shows.
 *
 * The appliances in `data.ts` are what ships with the build. An admin can
 * change any of their details, hide one, or add a service of their own — a
 * fan, a chimney, a water purifier — so the list is assembled from the three
 * at read time rather than being fixed in the code.
 *
 * Client and server both need this, so it stays out of the `server-only` layer.
 */

export type ServiceProblem = Problem;

export type ServiceTier = {
  /** How many units this tier covers — 1 AC, 2 ACs. */
  qty: number;
  /** What the whole tier costs. */
  price: number;
  /** What it would cost at single-unit price; omitted when there is no saving. */
  was?: number;
  /** A word on the tier, e.g. "Bestseller". */
  badge?: string;
};

export type ServiceStep = {
  title: string;
  body?: string;
  /** Shown under the step; the sheet reads better with them but works without. */
  image?: string;
};

export type ServiceFaq = { q: string; a: string };

/** The saving a tier gives, as a whole percentage. Zero when there isn't one. */
export function tierSaving(tier: ServiceTier): number {
  if (!tier.was || tier.was <= tier.price) return 0;
  return Math.round(((tier.was - tier.price) / tier.was) * 100);
}

/** The best saving on offer, for the "save up to" line. */
export function bestSaving(tiers: ServiceTier[] = []): number {
  return tiers.reduce((best, t) => Math.max(best, tierSaving(t)), 0);
}

/** A built-in appliance or an added one, with everything either needs. */
/** The four we are authorised for. A service may cover any subset. */
export const BRAND_IDS: BrandId[] = BRANDS.map((b) => b.id);

export type CatalogueService = Omit<Appliance, "id"> & {
  id: string;
  /**
   * Which manufacturers we service this appliance for. Empty is read as "all
   * four" so a service saved before this field existed doesn't lose its
   * brands.
   */
  brands?: BrandId[];
  /**
   * What this service starts at for a given make, where that differs — a
   * Bosch part is not a Samsung part. A brand with nothing set here falls back
   * to `startingPrice`, so only the brands that actually differ need filling
   * in.
   */
  brandPrices?: Partial<Record<BrandId, number>>;
  /**
   * What an individual repair costs on a given make, keyed by brand and then
   * by problem id. A part priced for one manufacturer says nothing about
   * another, and this is where that is recorded. Anything not set here falls
   * back to the problem's own band.
   */
  brandProblemPrices?: Partial<Record<BrandId, Record<string, [number, number]>>>;
  /**
   * Repairs that exist for one make only — an inverter board on a Samsung
   * fridge is not a repair every fridge can be booked for. They sit after the
   * shared list, and only for the make they belong to.
   */
  brandProblems?: Partial<Record<BrandId, ServiceProblem[]>>;
  /**
   * Quantity tiers, the way this trade is actually sold: one AC is one price,
   * three together are cheaper each. `was` is the price without the bundle, so
   * the saving is worked out rather than typed and can't drift from the maths.
   */
  tiers?: ServiceTier[];
  /** The line above the highlights — what this service is known for. */
  headline?: string;
  /** The ticked list under it. */
  highlights?: string[];
  /** How the visit runs, in order. */
  process?: ServiceStep[];
  /** What the price covers. */
  included?: string[];
  /** What the customer has to have ready — a bucket, a power point. */
  youNeed?: string[];
  /** The caveats, said before booking rather than at the door. */
  pleaseNote?: string[];
  /** Questions about this service in particular. */
  faqs?: ServiceFaq[];
  /** Hidden services stay in the panel and off the site. */
  active: boolean;
  /** Added here rather than shipped in the build — deletable. */
  custom?: boolean;
  /** Orders added services among themselves. */
  createdAt?: number;
};

/** Fields an admin may change on a built-in service. */
export type ServiceEdit = Partial<Omit<CatalogueService, "id" | "custom" | "createdAt">>;
export type ServiceEdits = Record<string, ServiceEdit>;

export const DEFAULT_SERVICES: CatalogueService[] = APPLIANCES.map((a) => ({
  ...a,
  active: true,
  brands: BRAND_IDS,
}));

export const EDITABLE_TEXT = ["name", "blurb", "serviceTime", "bookings"] as const;
export const EDITABLE_NUMBER = ["startingPrice", "rating"] as const;

/** Built-ins first, in the order the design puts them; added ones after. */
export function mergeCatalogue(edits: ServiceEdits, added: CatalogueService[]): CatalogueService[] {
  const builtIn = DEFAULT_SERVICES.map((s) => ({ ...s, ...(edits[s.id] ?? {}) }));
  const extras = [...added].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return [...builtIn, ...extras];
}

/** What a visitor sees — everything an admin hasn't hidden. */
export function visibleServices(all: CatalogueService[]): CatalogueService[] {
  return all.filter((s) => s.active);
}

/** A url-safe id from a name, so "Ceiling Fan" becomes "ceiling-fan". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * The kinds this appliance comes in.
 *
 * A washing machine is a front load or a top load and the visit is not the
 * same job; an air conditioner is a split or a window unit and the technician
 * carries different things. A service with none listed is one where the
 * question does not arise, and nothing is asked.
 */
export function variantsFor(service: CatalogueService): string[] {
  return service.variants ?? [];
}

/** Said by somebody who genuinely does not know, which is an answer too. */
export const UNSURE_VARIANT = "Not sure";

/** The brands a service covers, treating "unset" as all of them. */
export function brandsFor(service: CatalogueService): BrandId[] {
  return service.brands?.length ? service.brands : BRAND_IDS;
}

/** What this service starts at for a make — its own price, or the service's. */
export function priceFor(service: CatalogueService, brand?: BrandId): number {
  const own = brand ? service.brandPrices?.[brand] : undefined;
  return typeof own === "number" && own > 0 ? own : service.startingPrice;
}

/** What a repair costs on a make — its own band, or the problem's. */
export function bandFor(
  service: CatalogueService,
  problem: ServiceProblem,
  brand?: BrandId,
): [number, number] {
  const own = brand ? service.brandProblemPrices?.[brand]?.[problem.id] : undefined;
  return Array.isArray(own) && own.length === 2 ? own : problem.price;
}

/**
 * Everything this service can be booked for on a given make: the repairs every
 * make shares, then the ones added for this one.
 */
export function repairsFor(service: CatalogueService, brand?: BrandId): ServiceProblem[] {
  const extra = brand ? service.brandProblems?.[brand] ?? [] : [];
  return [...service.problems, ...extra];
}

/** True when the makes don't all start at the same number. */
export function pricesDiffer(service: CatalogueService): boolean {
  const set = new Set(brandsFor(service).map((b) => priceFor(service, b)));
  return set.size > 1;
}

/** True when the sheet has more to show than the price. */
export function hasDetail(s: CatalogueService): boolean {
  return Boolean(
    s.tiers?.length ||
      s.highlights?.length ||
      s.process?.length ||
      s.included?.length ||
      s.youNeed?.length ||
      s.pleaseNote?.length ||
      s.faqs?.length,
  );
}

/** A new service starts with one problem, because none at all can't be booked. */
export function blankProblem(): ServiceProblem {
  return { id: "general-repair", label: "General repair", price: [499, 1499], eta: "60 min", common: true };
}
