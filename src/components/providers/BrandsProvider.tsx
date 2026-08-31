"use client";

import { createContext, useContext } from "react";
import { DEFAULT_BRANDS, type AdminBrand } from "@/lib/brands-shared";

/**
 * The live list of makes, resolved once in the root layout and read by
 * whichever component needs it.
 *
 * A context rather than props, for the same reason the catalogue is one: the
 * brand list is used by the booking flow, the brands page, the footer and the
 * search palette, on pages that don't otherwise know about each other.
 */
const BrandsContext = createContext<AdminBrand[]>(DEFAULT_BRANDS);

export function BrandsProvider({
  brands,
  children,
}: {
  brands: AdminBrand[];
  children: React.ReactNode;
}) {
  return <BrandsContext.Provider value={brands}>{children}</BrandsContext.Provider>;
}

/** Every make the site is currently servicing. */
export function useBrands(): AdminBrand[] {
  return useContext(BrandsContext);
}
