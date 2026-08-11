import { APPLIANCES } from "./data";
import type { Appliance, Problem } from "./types";

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
export type CatalogueService = Omit<Appliance, "id"> & {
  id: string;
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

export const DEFAULT_SERVICES: CatalogueService[] = APPLIANCES.map((a) => ({ ...a, active: true }));

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

/** A new service starts with one problem, because none at all can't be booked. */
export function blankProblem(): ServiceProblem {
  return { id: "general-repair", label: "General repair", price: [499, 1499], eta: "60 min", common: true };
}
