import { useState } from 'react'
import { View } from 'react-native'
import type { CatalogBrand } from '@app/shared'
import { Img } from '@/components/ui/Img'
import { Text } from '@/components/ui/Text'

/**
 * The brands we service, as one row of logos.
 *
 * The logo alone — every one of them already carries the name, so a caption
 * under it says it twice. The wordmark is only for a brand with no file yet.
 * Tiles are one fixed height with the logo contained inside, so a wide
 * wordmark and a roundel sit on the same line.
 */

/** Four columns with an 8px gutter, sized off the row's own width. */
const COLUMNS = 4
const GUTTER = 8

export function BrandLogoRow({ brands }: { brands: readonly CatalogBrand[] }) {
  const [width, setWidth] = useState<number>()
  const cell = width === undefined ? undefined : Math.floor((width - GUTTER * (COLUMNS - 1)) / COLUMNS)

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className="flex-row flex-wrap"
      style={{ gap: GUTTER }}
    >
      {brands.map((brand) => (
        <View
          key={brand.id}
          className="h-14 items-center justify-center rounded-card border border-border bg-logo px-3"
          style={cell === undefined ? { width: '23%' } : { width: cell }}
        >
          {brand.logo ? (
            <Img src={brand.logo} alt={brand.name} contentFit="contain" className="h-6 w-full" />
          ) : (
            <Text className="text-center text-sm font-bold uppercase tracking-[1.1px] text-ink">{brand.wordmark}</Text>
          )}
        </View>
      ))}
    </View>
  )
}
