import Image from 'next/image'
import type { CatalogBrand } from '@app/shared'

/**
 * The brands we service, as one row of logos.
 *
 * The logo alone — every one of them already carries the name, so a caption
 * under it says it twice. The wordmark is only for a brand with no file yet.
 * Tiles are one fixed height with the logo contained inside, so a wide
 * wordmark and a roundel sit on the same line.
 */
export function BrandLogoRow({ brands }: { brands: readonly CatalogBrand[] }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {brands.map((brand) => (
        <li
          key={brand.id}
          className="flex h-14 items-center justify-center rounded-card border border-border px-3"
        >
          {brand.logo ? (
            <span className="relative block h-6 w-full">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                sizes="80px"
                className="object-contain"
              />
            </span>
          ) : (
            <span className="text-center text-sm font-bold tracking-[0.08em] text-ink uppercase">
              {brand.wordmark}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
