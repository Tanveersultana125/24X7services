import type { CatalogBrand } from '@app/shared'
import { BRAND_DISCLAIMER, BRAND_LOGOS_ENABLED } from '@/config/brand'
import { CardButton } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * A manufacturer, shown as a text wordmark.
 *
 * Not a logo. Rendering a manufacturer's mark implies an endorsement this
 * business does not have, so BRAND_LOGOS_ENABLED gates it and stays false until
 * an authorised partner agreement exists. Everywhere these appear,
 * BrandDisclaimer appears with them.
 */

export interface BrandCardProps {
  brand: CatalogBrand
  onSelect: (brand: CatalogBrand) => void
  selected?: boolean
  /** Off when the brand does not cover the chosen appliance in the matrix. */
  disabled?: boolean
  className?: string
}

export function BrandCard({ brand, onSelect, selected = false, disabled = false, className }: BrandCardProps) {
  return (
    <CardButton
      onPress={() => onSelect(brand)}
      selected={selected}
      disabled={disabled}
      ariaLabel={disabled ? `${brand.name}, not serviced for this appliance` : brand.name}
      className={cn('min-h-20 items-center justify-center p-4', className)}
    >
      {BRAND_LOGOS_ENABLED ? (
        // DECISION NEEDED: wire the logo asset here only once a partner
        // agreement is signed. Until then this branch never runs.
        <Text className="text-center text-base font-bold tracking-wide">{brand.name}</Text>
      ) : (
        <Text className="text-center text-base font-bold tracking-[1.3px] text-ink">{brand.wordmark}</Text>
      )}
    </CardButton>
  )
}

/** Required wherever manufacturer names are shown. */
export function BrandDisclaimer({ className }: { className?: string }) {
  return <Text className={cn('text-xs text-muted', className)}>{BRAND_DISCLAIMER}</Text>
}
