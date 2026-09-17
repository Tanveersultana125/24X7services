import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ChatScreen } from './ChatScreen'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'

export const metadata: Metadata = { title: 'Tell us what happened' }

/**
 * `useSearchParams` cannot be read during prerender, so the screen behind it
 * renders on the client and needs a boundary to prerender up to.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <SkeletonGroup
          label="Loading"
          className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-20 lg:max-w-2xl"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </SkeletonGroup>
      }
    >
      <ChatScreen />
    </Suspense>
  )
}
