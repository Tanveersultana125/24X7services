'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * "☰ Menu", floating at the foot of a long list, the way the marketplaces put
 * it on a category: a way to the part of the page you want without scrolling
 * past the parts you do not. Tapped, it opens a short list of the page's
 * sections above itself; tapping one scrolls there and closes the list.
 *
 * It floats over the page's pinned bar at the bottom, centred, and never
 * covers the bar's button: it sits a gap above it.
 *
 * The sections are the page's own — each entry is the id of an element on
 * it — so the menu cannot offer a heading the page does not have.
 */

export interface SectionMenuItem {
  id: string
  label: string
  /** "4 services" — what the section holds. */
  note?: string
}

export function SectionMenu({
  items,
  aboveBar = false,
}: {
  items: readonly SectionMenuItem[]
  /** Whether a bar is pinned over the bottom nav (the cart's), to clear it. */
  aboveBar?: boolean
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement | null>(null)

  // Closes on a tap anywhere else and on Escape, as a menu does.
  useEffect(() => {
    if (!open) return
    function away(event: PointerEvent): void {
      if (box.current && !box.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function escape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  if (items.length < 2) return null

  function go(id: string): void {
    setOpen(false)
    const target = document.getElementById(id)
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div
      ref={box}
      // Above the bottom nav (72px), and above the pinned bar over it (4.5rem)
      // when there is one, with a gap; on a laptop there is no bottom nav.
      className={cn(
        'fixed inset-x-0 z-30 flex flex-col items-center px-4',
        aboveBar
          ? 'bottom-[calc(72px+4.5rem+0.75rem+var(--safe-bottom))] lg:bottom-[calc(4.5rem+1rem)]'
          : 'bottom-[calc(72px+1rem+var(--safe-bottom))] lg:bottom-6'
      )}
    >
      {open ? (
        <nav
          aria-label="Sections on this page"
          className="mb-3 w-full max-w-xs overflow-hidden rounded-card bg-night text-white shadow-raised"
        >
          <ul className="py-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-4 px-5 text-left text-base hover:bg-white/10"
                >
                  <span className="font-semibold">{item.label}</span>
                  {item.note ? (
                    <span className="shrink-0 text-sm text-white/60">
                      {item.note}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'inline-flex h-12 items-center gap-2 rounded-pill bg-night px-6 text-base font-semibold text-white shadow-raised',
          'transition-transform duration-[var(--duration-fast)] active:scale-95'
        )}
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
        {open ? 'Close' : 'Menu'}
      </button>
    </div>
  )
}
