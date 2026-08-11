"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SERVICES, type CatalogueService } from "@/lib/catalogue-shared";

/**
 * The live service catalogue, resolved once in the root layout and read by
 * whichever component needs it.
 *
 * A context rather than props: the catalogue is used by the booking flow, the
 * estimate form, the services page and the "most booked" strip, on pages that
 * don't otherwise know about each other.
 */
const ServicesContext = createContext<CatalogueService[]>(DEFAULT_SERVICES);

export function ServicesProvider({
  services,
  children,
}: {
  services: CatalogueService[];
  children: React.ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

/** Everything the site is currently offering. */
export function useServices(): CatalogueService[] {
  return useContext(ServicesContext);
}
