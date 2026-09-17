'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'

/**
 * The top of Home, and the only brand-filled header in the app.
 *
 * Every other screen wears a white bar with a title, because every other screen
 * is somewhere you navigated to. Home is the front door, so it carries the
 * brand: the two things a customer does first — say where they are, and say
 * what is broken — sit on a blue panel that marks the screen as the start of
 * everything rather than one more page in a stack.
 *
 * It ends flush, with no padding under the search field, because the banner
 * below it runs edge to edge and butts straight up against this. A gap there
 * would put a white seam across the top of the screen and turn one block into
 * two.
 *
 * It stays stuck to the top while the page scrolls. The search field is the
 * single most-used control on this screen, and a customer three sections down
 * who thinks of the word "geyser" should not have to scroll back up to type it.
 */
export function HomeHeader({
  area,
  detail,
  onChangeLocation,
  onSearch,
}: {
  /** The saved area, once there is one. Absent reads as "Set your location". */
  area?: string
  /** City and pincode, on the line under it. */
  detail?: string
  onChangeLocation: () => void
  onSearch: () => void
}) {
  return (
    <div className="sticky top-0 z-30 bg-linear-to-b from-brand-deep to-brand pt-[var(--safe-top)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-start gap-2 px-4 pt-2">
        <LocationSelector
          className="min-w-0 flex-1"
          area={area}
          detail={detail}
          onDark
          onClick={onChangeLocation}
        />
        {/* A white tile rather than a bare icon: on a saturated header an
            outline-weight glyph on its own reads as decoration, not a button. */}
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
