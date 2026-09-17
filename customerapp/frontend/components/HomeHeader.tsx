'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'
import { cn } from '@/lib/cn'

/**
 * The top of Home: where the customer is, and what they are looking for.
 *
 * It paints nothing. On a phone it floats over the banner, which runs from the
 * very top of the screen up behind it, so the whole coloured block at the top
 * is one element rather than a bar with a card under it. That is the only way
 * the join stays invisible: matching a header colour to a banner colour works
 * for one banner and breaks on the next one somebody seeds a different shade
 * of.
 *
 * Which means it is only legible while something dark is behind it. Two things
 * keep that true: Home always renders a hero — the banner when there is one, a
 * plain brand block when there is not — and the moment that hero scrolls past,
 * `solid` turns the header into a filled bar so the white text never lands on
 * the white page underneath.
 *
 * Fixed rather than sticky, because sticky takes up its own row and would push
 * the banner down out from under it.
 */
export function HomeHeader({
  area,
  detail,
  solid = false,
  onChangeLocation,
  onSearch,
}: {
  /** The saved area, once there is one. Absent reads as "Set your location". */
  area?: string
  /** City and pincode, on the line under it. */
  detail?: string
  /** Set once the hero has scrolled away and there is nothing dark behind. */
  solid?: boolean
  onChangeLocation: () => void
  onSearch: () => void
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-30 pt-[var(--safe-top)] lg:hidden',
        'transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-soft)]',
        // Over the artwork, a fade that is strongest at the very top and gone
        // by the search field — enough to hold the white text on a light patch
        // of somebody's banner, not enough to draw an edge anywhere.
        solid ? 'bg-brand-deep' : 'bg-linear-to-b from-ink/30 to-transparent'
      )}
    >
      <div className="mx-auto flex max-w-lg items-start gap-2 px-4 pt-2">
        <LocationSelector
          className="min-w-0 flex-1"
          area={area}
          detail={detail}
          onDark
          onClick={onChangeLocation}
        />
        {/* A white tile rather than a bare icon: over artwork an outline-weight
            glyph on its own reads as decoration, not as a button. */}
        <Link
          href="/profile/notifications"
          aria-label="Notifications"
          className="flex size-11 shrink-0 items-center justify-center rounded-card bg-bg text-brand hover:bg-brand-soft"
        >
          <Bell className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mx-auto max-w-lg px-4 pt-3 pb-4">
        <SearchBar readOnly onDark onOpen={onSearch} />
      </div>
    </div>
  )
}

/**
 * The height the header occupies, as a Tailwind padding utility.
 *
 * The banner starts at the top of the screen and the header floats on it, so
 * the banner's own words have to begin below this or they end up underneath the
 * search field. Exported so the one number lives next to the markup that sets
 * it rather than being guessed at from the other side of the app.
 */
export const HOME_HEADER_CLEARANCE = 'pt-[calc(var(--safe-top)+8.5rem)]'

/** The same height in pixels, for the scroll observer that flips `solid`. */
export const HOME_HEADER_HEIGHT = 136
