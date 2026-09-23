'use client'

import Image from 'next/image'
import type { CatalogBrand } from '@app/shared'
import { brandDisclaimer } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * The brands we service, as a grid, with the sentence that has to sit under it.
 *
 * A tile shows the brand's own logo where there is a file for it and the
 * wordmark where there is not — see `public/brands/README.md`. The fallback is
 * not a placeholder waiting to be replaced: a name set in type is a perfectly
 * good way to say which appliances we work on, and it is the honest one until
 * the logo files arrive from the manufacturers who own them.
 *
 * The tiles are neutral and identical, which is a design decision rather than
 * a limitation. Eleven manufacturers' palettes side by side is a fruit salad,
 * and a grid where one brand's tile is louder than another's reads as a
 * ranking nobody agreed to.
 *
 * The disclaimer is generated from the brands actually on screen. It used to
 * name four of them in a constant, which was wrong the moment a fifth was
 * added and right again only if somebody remembered.
 */
export function BrandGrid({
  brands,
  /** The tile shown last, for the brands not listed. */
  more = true,
  className,
}: {
  brands: readonly CatalogBrand[]
  more?: boolean
  className?: string
}) {
  if (brands.length === 0) return null

  return (
    <div className={className}>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {brands.map((brand) => (
          <li key={brand.id}>
            <BrandTile brand={brand} />
          </li>
        ))}
        {more ? (
          <li>
            <div className="flex h-16 items-center justify-center rounded-card bg-surface px-2 text-center text-sm text-muted">
              &amp; more
            </div>
          </li>
        ) : null}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {brandDisclaimer(brands.map((brand) => brand.name))}
      </p>
    </div>
  )
}

/**
 * One tile.
 *
 * Fixed height and the logo contained inside it, so a wide wordmark and a
 * square device both sit on the same baseline — a grid where the tiles are as
 * tall as whatever was dropped into them is the thing that makes a logo wall
 * look assembled rather than designed.
 */
function BrandTile({ brand }: { brand: CatalogBrand }) {
  return (
    <div
      className={cn(
        'flex h-16 items-center justify-center rounded-card bg-surface px-3'
      )}
    >
      {brand.logo ? (
        <span className="relative block h-8 w-full">
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            sizes="120px"
            className="object-contain"
          />
        </span>
      ) : (
        // Sized to the word rather than truncated. "WHIRLPOOL" at the same
        // size as "IFB" does not fit a third of a phone, and a wordmark
        // cut to "WHIRLP…" is worse than no logo at all — it reads as the
        // grid being broken rather than as the brand being long.
        <span
          className={cn(
            'text-center font-bold text-ink uppercase',
            brand.wordmark.length > 8
              ? 'text-xs tracking-[0.02em]'
              : 'text-sm tracking-[0.08em]'
          )}
        >
          {brand.wordmark}
        </span>
      )}
    </div>
  )
}
