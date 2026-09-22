import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TopicScreen } from './TopicScreen'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'

export const metadata: Metadata = { title: 'Help' }

/**
 * The topic arrives as `?t=`, and `useSearchParams` cannot be read during
 * prerender — so the screen renders on the client behind a boundary the export
 * can prerender up to.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <SkeletonGroup
          label="Loading"
          className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-20 lg:max-w-2xl"
        >
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </SkeletonGroup>
      }
    >
      <TopicScreen />
    </Suspense>
  )
}
