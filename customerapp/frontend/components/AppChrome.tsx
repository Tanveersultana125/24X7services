'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { OfflineBanner } from '@/components/ErrorState'
import { useOnline } from '@/lib/useOnline'

/**
 * The three things that sit outside every screen.
 *
 * A skip link, so a keyboard or screen-reader user does not walk through the
 * navigation on every page. A live region that says where they have arrived,
 * because a client-side navigation changes the whole page without the browser
 * announcing anything. And the offline banner, which belongs above everything
 * rather than being remembered on each screen.
 */
export function AppChrome() {
  return (
    <>
      <SkipLink />
      <OfflineBar />
      <RouteAnnouncer />
    </>
  )
}

/**
 * Hidden until focused, which is the whole trick: invisible to everyone who
 * does not need it, and the first stop for everyone who does.
 *
 * It targets `#content`, which the shells put on their `main`.
 */
function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only rounded-card bg-ink px-4 py-2 text-sm font-semibold text-bg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to content
    </a>
  )
}

function OfflineBar() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="sticky top-0 z-50">
      <OfflineBanner />
    </div>
  )
}

/**
 * Say the name of the page that was just navigated to.
 *
 * A single-page navigation replaces the content without the browser saying
 * anything, so a screen reader user is left on a page that has silently become
 * a different one. The title is read from `document.title`, which every route
 * sets through its metadata, and announced a tick later — the title is updated
 * after the commit, so reading it synchronously gets the previous page's.
 *
 * The first load is skipped. The browser announces that one itself, and
 * repeating it is noise.
 */
function RouteAnnouncer() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState('')
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    const timer = setTimeout(() => {
      setAnnouncement(document.title)
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <p aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  )
}
