import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ServiceDetailScreen } from './ServiceDetailScreen'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'

export const metadata: Metadata = { title: 'Service' }

/**
 * The service arrives as `?a=` and `?s=`, and `useSearchParams` cannot be read
 * during prerender — so the screen renders on the client behind a boundary the
 * export can prerender up to.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <SkeletonGroup
          label="Loading"
          className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-20 lg:max-w-2xl"
        >
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-24 w-full" />
        </SkeletonGroup>
      }
    >
      <ServiceDetailScreen />
    </Suspense>
  )
}
