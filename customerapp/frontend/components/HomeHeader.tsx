'use client'

import { Bell, LogIn, LogOut, WalletMinimal } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { LocationSelector } from '@/components/LocationSelector'
import { ConfirmModal } from '@/components/Modal'
import { SearchBar } from '@/components/SearchBar'
import { useToast } from '@/components/Toast'
import { signOut, useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'
import { formatPhone } from '@/lib/format'

/**
 * The top of Home: where the customer is, and what they are looking for.
 *
 * It paints nothing. On a phone it floats over the banner, which runs from the
 * very top of the screen up behind it, so the whole coloured block at the top
 * is one element rather than a bar with a card under it. That is the only
 * arrangement with no seam in it: give the header its own fill and the line
 * where that fill stops is visible the moment a banner is seeded in a shade
 * the header is not.
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
        <div className="flex shrink-0 gap-2">
          {/* The wallet glyph every app of this shape puts in this corner,
              opening the balance: credits we issued, plus whatever the
              customer has added. Closed loop — it buys our own services and
              nothing else — which is the condition on it being here at all. */}
          <HeaderTile
            href="/profile/wallet"
            label="Balance"
            icon={WalletMinimal}
          />
          <HeaderTile
            href="/profile/notifications"
            label="Notifications"
            icon={Bell}
          />
          <AccountTile />
        </div>
      </div>
      <div className="mx-auto max-w-lg px-4 pt-3 pb-4">
        <SearchBar readOnly onDark onOpen={onSearch} />
      </div>
    </div>
  )
}

/**
 * Log in, or log out, from the top of Home.
 *
 * A labelled button rather than a bare glyph: the log-in and log-out arrows
 * are mirror images of each other, and on their own nobody can tell which one
 * they are looking at. Logging out asks first, with the number it is leaving,
 * because it is one tap from the top of the most-used screen.
 *
 * Nothing until Firebase has reported whether anyone is signed in, so the
 * button never says "Login" for a beat to somebody who already is.
 */
function AccountTile() {
  const { user, ready } = useAuth()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)

  if (!ready) return <span className="h-11 w-20" aria-hidden="true" />

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent('/home')}` as Route}
        className={PILL_CLASS}
      >
        <LogIn className="size-4" aria-hidden="true" />
        Login
      </Link>
    )
  }

  async function leave(): Promise<void> {
    setLeaving(true)
    try {
      await signOut()
      setConfirming(false)
      toast.show('You have been logged out.')
    } catch {
      toast.show('We could not log you out. Please try again.', {
        tone: 'error',
      })
    } finally {
      setLeaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={PILL_CLASS}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Logout
      </button>
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void leave()}
        loading={leaving}
        destructive
        title="Log out of 24X7?"
        description={
          user.phoneNumber
            ? `You are logged in as ${formatPhone(user.phoneNumber)}. Your bookings stay saved to this number.`
            : 'Your bookings stay saved to your account.'
        }
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
      />
    </>
  )
}

const PILL_CLASS =
  'flex h-11 items-center gap-1.5 rounded-card bg-bg px-3 text-sm font-semibold text-brand hover:bg-brand-soft'

const TILE_CLASS =
  'flex size-11 items-center justify-center rounded-card bg-bg text-brand hover:bg-brand-soft'

/**
 * One of the square buttons in the top right.
 *
 * A filled white tile rather than a bare icon: over a banner an outline-weight
 * glyph on its own reads as decoration, not as something to press. Two of them
 * and the Login button is the ceiling — the location has to keep enough width
 * to show an area name before it truncates.
 */
function HeaderTile({
  href,
  label,
  icon: Icon,
}: {
  href: Route
  label: string
  icon: typeof Bell
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={TILE_CLASS}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Link>
  )
}

/**
 * The height the header occupies, as a Tailwind padding utility.
 *
 * The banner starts at the top of the screen and the header floats on it, so
 * the banner's own words have to begin below this or they end up underneath
 * the search field. Exported so the one number lives next to the markup that sets
 * it rather than being guessed at from the other side of the app.
 */
export const HOME_HEADER_CLEARANCE = 'pt-[calc(var(--safe-top)+8.5rem)]'

/** The same height in pixels, for the scroll observer that flips `solid`. */
export const HOME_HEADER_HEIGHT = 136
