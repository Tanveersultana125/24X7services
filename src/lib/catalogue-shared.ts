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

/** True when the makes don't all start at the same number. */
export function pricesDiffer(service: CatalogueService): boolean {
  const set = new Set(brandsFor(service).map((b) => priceFor(service, b)));
  return set.size > 1;
}

/** A new service starts with one problem, because none at all can't be booked. */
export function blankProblem(): ServiceProblem {
  return { id: "general-repair", label: "General repair", price: [499, 1499], eta: "60 min", common: true };
}
