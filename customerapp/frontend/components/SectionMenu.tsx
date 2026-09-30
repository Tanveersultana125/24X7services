'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Check, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * "☰ Menu", floating at the foot of a long list, the way the marketplaces put
 * it on a category: a way to the part of the page you want without scrolling
 * past the parts you do not.
 *
 * Tapped, the page dims and a card rises over it with a tile per section — a
 * photograph of that kind of work, or for the plan its saving, and the name
 * under it — then, where the appliance comes in kinds, a tile per kind
 * (front-load, top-load…) to say which one is yours. A round close button
 * sits under the card where the pill was. A section tile scrolls there; a
 * kind tile picks that kind for the page. Either closes it all, as do the
 * dimmed page, the close button and Escape.
 *
 * The sections are the page's own — each tile is the id of an element on it —
 * so the menu cannot offer a heading the page does not have.
 */

export interface SectionMenuItem {
  id: string
  label: string
  /** A photograph of that section's work. */
  photo?: string
  /**
   * Words in place of a photograph — for the plan, its saving:
   * ["Save", "18%", "OFF"], the middle one set large.
   */
  offer?: readonly [string, string, string]
}

export interface SectionMenuType {
  key: string
  label: string
  photo?: string
}

export function SectionMenu({
  items,
  types = [],
  typeTitle,
  chosenType = null,
  onType,
  aboveBar = false,
}: {
  items: readonly SectionMenuItem[]
  /**
   * The kinds of machine the appliance comes in, as a second row of tiles.
   * Picking one tells the page which kind is the customer's; picking the
   * chosen one again lets go.
   */
  types?: readonly SectionMenuType[]
  /** The heading over the kinds: "Machine type". */
  typeTitle?: string
  chosenType?: string | null
  onType?: (key: string | null) => void
  /** Whether a bar is pinned over the bottom nav (the cart's), to clear it. */
  aboveBar?: boolean
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function escape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])

  if (items.length < 2) return null

  function go(id: string): void {
    setOpen(false)
    const target = document.getElementById(id)
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  // Above the bottom nav (72px), and above the pinned bar over it (4.5rem)
  // when there is one, with a gap; on a laptop there is no bottom nav.
  const lift = aboveBar
    ? 'bottom-[calc(72px+4.5rem+0.75rem+var(--safe-bottom))] lg:bottom-[calc(4.5rem+1rem)]'
    : 'bottom-[calc(72px+1rem+var(--safe-bottom))] lg:bottom-6'
  // The same distance as padding, so the close button lands where the pill was.
  const liftPad = aboveBar
    ? 'pb-[calc(72px+4.5rem+0.75rem+var(--safe-bottom))] lg:pb-[calc(4.5rem+1rem)]'
    : 'pb-[calc(72px+1rem+var(--safe-bottom))] lg:pb-6'

  return (
    <>
      {open
        ? // On <body>, so it dims the whole screen — the bottom nav too —
          // rather than stopping at whatever stacking context the page is in.
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Jump to a section"
              className={cn(
                'fixed inset-0 z-50 flex flex-col items-center justify-end bg-night/60 px-4',
                liftPad
              )}
              // A tap on the dimmed page, not on the card, closes it.
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false)
              }}
            >
              <div className="flex w-full max-w-md flex-col items-center">
                <div className="max-h-[70dvh] w-full overflow-y-auto rounded-[1.25rem] bg-bg px-4 py-6">
                  <ul className="grid grid-cols-3 gap-x-3 gap-y-6">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => go(item.id)}
                          className="group flex w-full flex-col items-center text-center"
                        >
                          <span className="relative block aspect-square w-full max-w-24 overflow-hidden rounded-card bg-plate transition-transform duration-[var(--duration-fast)] group-active:scale-95">
                            {item.offer ? (
                              <span className="flex size-full flex-col items-center justify-center leading-none text-success">
                                <span className="text-xs font-semibold">
                                  {item.offer[0]}
                                </span>
                                <span className="mt-1 text-2xl font-bold">
                                  {item.offer[1]}
                                </span>
                                <span className="mt-1 text-lg font-bold">
                                  {item.offer[2]}
                                </span>
                              </span>
                            ) : item.photo ? (
                              <Image
                                src={item.photo}
                                alt=""
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="mt-2 line-clamp-2 text-sm leading-snug text-ink">
                            {item.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {types.length > 0 && onType ? (
                    <div className="mt-6 border-t border-border pt-5">
                      <p className="text-base font-semibold text-ink">
                        {typeTitle ?? 'Type'}
                      </p>
                      <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-6">
                        {types.map((type) => {
                          const on = chosenType === type.key
                          return (
                            <li key={type.key}>
                              <button
                                type="button"
                                onClick={() => {
                                  onType(on ? null : type.key)
                                  setOpen(false)
                                }}
                                aria-pressed={on}
                                className="group flex w-full flex-col items-center text-center"
                              >
                                <span
                                  className={cn(
                                    'relative block aspect-square w-full max-w-24 overflow-hidden rounded-card bg-plate transition-transform duration-[var(--duration-fast)] group-active:scale-95',
                                    on && 'ring-2 ring-brand ring-offset-2 ring-offset-bg'
                                  )}
                                >
                                  {type.photo ? (
                                    // Product shots on white, so contained and
                                    // multiplied onto the tile rather than
                                    // cropped through the machine.
                                    <Image
                                      src={type.photo}
                                      alt=""
                                      fill
                                      sizes="96px"
                                      className="object-contain p-2 mix-blend-multiply"
                                    />
                                  ) : null}
                                  {on ? (
                                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                                      <Check className="size-3.5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </span>
                                <span
                                  className={cn(
                                    'mt-2 line-clamp-2 text-sm leading-snug',
                                    on ? 'font-semibold text-brand' : 'text-ink'
                                  )}
                                >
                                  {type.label}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="mt-5 flex size-12 items-center justify-center rounded-full bg-bg text-ink shadow-raised"
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      {!open ? (
        <div
          className={cn(
            'pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4',
            lift
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-pill bg-night px-6 text-base font-semibold text-white shadow-raised transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            <Menu className="size-5" aria-hidden="true" />
            Menu
          </button>
        </div>
      ) : null}
    </>
  )
}
