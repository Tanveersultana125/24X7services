import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ApplianceScreen } from './ApplianceScreen'
import { ServiceListSkeleton } from '@/components/SkeletonLoader'

export const metadata: Metadata = { title: 'Appliance services' }

/**
 * `useSearchParams` cannot be read while the page is prerendered, so anything
 * that calls it renders on the client and needs a boundary to prerender up to.
 * Without the Suspense wrapper the build fails outright.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-lg px-4 pt-20 lg:max-w-5xl lg:px-6">
          <ServiceListSkeleton />
        </div>
      }
    >
      <ApplianceScreen />
    </Suspense>
  )
}
