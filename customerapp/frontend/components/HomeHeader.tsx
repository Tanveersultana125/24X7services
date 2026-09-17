'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { LocationSelector } from '@/components/LocationSelector'
import { SearchBar } from '@/components/SearchBar'

/**
 * The top of Home, and the only ink-filled header in the app.
 *
 * Every other screen wears a white bar with a title, because every other screen
 * is somewhere you navigated to. Home is the front door, so it carries the
 * brand: the two things a customer does first — say where they are, and say
 * what is broken — sit on a dark panel that marks the screen as the start of
 * everything rather than one more page in a stack.
 *
 * It stays stuck to the top while the page scrolls. The search field is the
 * single most-used control on this screen, and a customer three sections down
 * who thinks of the word "geyser" should not have to scroll back up to type it.
 */
export function HomeHeader({
  area,
  onChangeLocation,
  onSearch,
}: {
  /** The saved area, once there is one. Absent reads as "Set location". */
  area?: string
  onChangeLocation: () => void
  onSearch: () => void
}) {
  return (
    <div className="sticky top-0 z-30 bg-ink pt-[var(--safe-top)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 pt-1">
        <LocationSelector
          className="min-w-0 flex-1"
          area={area}
          onDark
          onClick={onChangeLocation}
        />
        <Link
          href="/profile/notifications"
          aria-label="Notifications"
          className="flex size-11 items-center justify-center rounded-full text-bg hover:bg-bg/10"
        >
          <Bell className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mx-auto max-w-lg px-4 pb-3.5">
        <SearchBar readOnly onDark onOpen={onSearch} />
      </div>
    </div>
  )
}
