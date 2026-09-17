import type { Route } from 'next'
import Link from 'next/link'
import { Construction } from 'lucide-react'

/**
 * A placeholder for a screen that has not been built yet.
 *
 * Every route in the app exists from Phase 1 so `typedRoutes` has something to
 * check every href against. Without the stubs, each link would be a type error
 * until the screen behind it landed, and the checking would have to be switched
 * off during exactly the phases where a broken link is easiest to introduce.
 *
 * Each phase replaces these with the real screens. Any of them still standing
 * at the end is a screen that was missed.
 */

export function ScreenStub({
  title,
  route,
  note,
}: {
  title: string
  route: string
  note?: string
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface">
        <Construction className="size-5 text-muted" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {note ? <p className="max-w-sm text-sm text-muted">{note}</p> : null}
      <code className="rounded-pill border border-border bg-surface px-3 py-1 text-xs text-muted">
        {route}
      </code>
      <Link
        href={'/dev/components' as Route}
        className="mt-4 text-sm font-medium text-ink underline"
      >
        Component library
      </Link>
    </main>
  )
}
