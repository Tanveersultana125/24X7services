"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SITE_IMAGES, NO_IMAGE, type SiteImages } from "@/lib/site-images-shared";

/**
 * The current image for every slot, resolved once in the root layout and read
 * by whichever component needs one.
 *
 * A context rather than props: these photos sit inside components used on many
 * pages (Contact on five, the FAQ on two), and threading a src through every
 * page that renders them would mean touching every page to change a picture.
 */
const SiteImagesContext = createContext<SiteImages>(DEFAULT_SITE_IMAGES);

export function SiteImagesProvider({
  images,
  children,
}: {
  images: SiteImages;
  children: React.ReactNode;
}) {
  return <SiteImagesContext.Provider value={images}>{children}</SiteImagesContext.Provider>;
}

/**
 * The image assigned to a slot, or the one that ships with the build. Empty
 * when an admin has deleted it — every caller renders nothing in that case,
 * rather than an image element pointing at nowhere.
 */
export function useSiteImage(key: string): string {
  const images = useContext(SiteImagesContext);
  const src = images[key] ?? DEFAULT_SITE_IMAGES[key] ?? "";
  return src === NO_IMAGE ? "" : src;
}

/**
 * The whole map, for a list that resolves one image per row — a hook can't be
 * called inside a `.map()`.
 */
export function useSiteImages(): SiteImages {
  return useContext(SiteImagesContext);
}
