import { BRANDS } from "./data";
import { slugify } from "./catalogue-shared";
import type { Brand, BrandId } from "./types";

/**
 * The makes the site services.
 *
 * The four in `data.ts` are what ships with the build. An admin can change any
 * of their details, hide one, or add a company of their own — Whirlpool, Godrej,
 * a local make — so the list is assembled at read time rather than fixed in the
 * code, exactly as the service catalogue is.
 *
 * Client and server both need this, so it stays out of the `server-only` layer.
 */

export type AdminBrand = Brand & {
  /** Hidden makes stay in the panel and off the site. */
  active: boolean;
  /** Added in the panel rather than shipped in the build — deletable. */
  custom?: boolean;
  /** Orders added makes among themselves. */
  createdAt?: number;
};

/** Fields an admin may change on a built-in make. */
export type BrandEdit = Partial<Omit<AdminBrand, "id" | "custom" | "createdAt">>;
export type BrandEdits = Record<string, BrandEdit>;

export const DEFAULT_BRANDS: AdminBrand[] = BRANDS.map((b) => ({ ...b, active: true }));

/** The ids that exist in the code — a reset only means something for these. */
export const BUILT_IN_BRAND_IDS = new Set<string>(BRANDS.map((b) => b.id));

/** A company added in the panel has no house colour until one is picked. */
export const DEFAULT_BRAND_ACCENT = "#334155";

/** Built-ins first, in the order the design puts them; added ones after. */
export function mergeBrands(edits: BrandEdits, added: AdminBrand[]): AdminBrand[] {
  const builtIn = DEFAULT_BRANDS.map((b) => ({ ...b, ...(edits[b.id] ?? {}) }));
  const extras = [...added].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return [...builtIn, ...extras];
}

/** What a visitor sees — every make an admin hasn't hidden. */
export function visibleBrands(all: AdminBrand[]): AdminBrand[] {
  return all.filter((b) => b.active);
}

export function brandIds(list: AdminBrand[]): BrandId[] {
  return list.map((b) => b.id);
}

/** A url-safe id from a company name, so "Blue Star" becomes "blue-star". */
export function brandSlug(name: string): string {
  return slugify(name);
}
