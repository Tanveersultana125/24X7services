import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchScreen } from './SearchScreen'

export const metadata: Metadata = { title: 'Search' }

/**
 * SearchScreen reads `?q=` with `useSearchParams`, which cannot be read while
 * the page is prerendered — so it renders on the client, inside a boundary.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchScreen />
    </Suspense>
  )
}
