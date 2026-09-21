'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'
import { cn } from '@/lib/cn'

/**
 * The top of Home: where the customer is, and what they are looking for.
 *
 * It paints nothing. On a phone it floats over Home's hero — a brand-coloured
 * block that Home renders on every path, whether the catalog arrived or not —
 * and that block starts at `brand-deep`, the same colour this header fills
 * with once it has to. So there is no join to see at the top of the screen and
 * no moment where the fill jumps a shade as the page scrolls.
 *
 * It floated over the banner artwork itself until the offers became inset
 * cards. That was the only arrangement that kept the join invisible while the
 * block was painted by a banner whose colour is seed data — five gradients, any
 * of which could be under the search field. Now the block is the app's own
 * colour and the banner is a card sitting on it, which is what Urban Company,
 * Swiggy and every other app of this shape do, and what a customer reads as
 * "this is an offer" rather than "this is the page".
 *
 * It is still only legible while something dark is behind it, so the moment the
 * hero scrolls past, `solid` turns the header into a filled bar and the white
 * text never lands on the white page underneath.
 *
 * Fixed rather than sticky, because sticky takes up its own row and would push
 * the hero down out from under it.
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
        // Nothing until the hero has gone: the hero's own top stop is this
        // exact colour, so painting it here as well would only risk the two
        // drifting apart.
        solid ? 'bg-brand-deep' : 'bg-transparent'
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
 * The hero starts at the top of the screen and the header floats on it, so
 * whatever the hero holds has to begin below this or it ends up underneath the
 * search field. Exported so the one number lives next to the markup that sets
 * it rather than being guessed at from the other side of the app.
 */
export const HOME_HEADER_CLEARANCE = 'pt-[calc(var(--safe-top)+8.5rem)]'

/** The same height in pixels, for the scroll observer that flips `solid`. */
export const HOME_HEADER_HEIGHT = 136
