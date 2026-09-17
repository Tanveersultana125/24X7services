'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where } from 'firebase/firestore'
import {
  brandApplianceMatrixEntrySchema,
  COL,
  type CatalogBrand,
} from '@app/shared'

import { BookingStep } from '@/components/BookingStep'
import { BrandCard, BrandDisclaimer } from '@/components/BrandCard'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchBrands } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { patchDraft, useBookingDraft } from '@/lib/bookingDraft'
import { useAsync } from '@/lib/useAsync'

/**
 * Which manufacturer made it.
 *
 * Brands we do not service for this particular appliance are shown greyed out
 * rather than hidden. Someone looking for Bosch needs to find out that we do
 * not take Bosch dishwashers; a list that quietly omits it reads as a list that
 * has forgotten it, and they try again tomorrow.
 *
 * Wordmarks, never logos — see BRAND_LOGOS_ENABLED. The disclaimer sits with
 * them, every time they appear.
 */
export function BrandScreen() {
  const router = useRouter()
  const { draft } = useBookingDraft()
  const applianceId = draft.applianceId

  const load = useCallback(async (): Promise<{
    brands: CatalogBrand[]
    enabled: Set<string>
  }> => {
    if (!applianceId) return { brands: [], enabled: new Set() }

    const [brands, matrix] = await Promise.all([
      fetchBrands(),
      getDocs(
        query(
          collection(db(), COL.brandApplianceMatrix),
          where('applianceId', '==', applianceId)
        )
      ),
    ])

    const enabled = new Set<string>()
    for (const doc of matrix.docs) {
      const parsed = brandApplianceMatrixEntrySchema.safeParse(doc.data())
      if (parsed.success && parsed.data.enabled) enabled.add(parsed.data.brandId)
    }
    return { brands, enabled }
  }, [applianceId])

  const data = useAsync(load)

  function choose(brand: CatalogBrand): void {
    patchDraft({ brandId: brand.id })
    router.push('/book/details')
  }

  return (
    <BookingStep stepKey="brand" title="Which brand is it?">
      {data.status === 'loading' ? (
        <SkeletonGroup
          label="Loading brands"
          className="mt-6 grid grid-cols-2 gap-3"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </SkeletonGroup>
      ) : data.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={data.reload}
          retrying={data.refreshing}
        />
      ) : (
        <>
          <p className="mt-5 text-sm text-muted">
            This tells your expert which parts and tools to bring.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.data?.brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onSelect={choose}
                selected={draft.brandId === brand.id}
                disabled={!data.data?.enabled.has(brand.id)}
              />
            ))}
          </div>

          <p className="mt-4 text-sm text-muted">
            Not listed?{' '}
            <a href="/support/" className="font-medium text-ink underline">
              Tell us the brand
            </a>{' '}
            and we will say whether we can help.
          </p>

          <BrandDisclaimer className="mt-6" />
        </>
      )}
    </BookingStep>
  )
}
