'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * The behaviour Modal and BottomSheet share: a portal at the document root,
 * focus moved in and then restored, Escape to close, a focus trap, and the
 * page behind held still.
 *
 * Doing this once matters more than it looks. A dialog that leaves focus on the
 * page behind it is a dialog a keyboard user can tab straight out of without
 * noticing, and a scroll lock that forgets to release leaves the whole app
 * frozen after a close.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface OverlayProps {
  open: boolean
  onClose: () => void
  /** Escape and a backdrop tap are off while a request is in flight. */
  dismissable?: boolean
  labelledBy?: string
  describedBy?: string
  className?: string
  backdropClassName?: string
  children: React.ReactNode
}

export function Overlay({
  open,
  onClose,
  dismissable = true,
  labelledBy,
  describedBy,
  className,
  backdropClassName,
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    if (dismissable) onClose()
  }, [dismissable, onClose])

  // Hold the page still, and put it back exactly as it was. Reading the
  // existing value rather than assuming '' means a nested overlay closing does
  // not unlock the one still open underneath it.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Move focus in, then hand it back to whatever opened the dialog.
  useEffect(() => {
    if (!open) return
    restoreFocusTo.current = document.activeElement as HTMLElement | null

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    return () => {
      restoreFocusTo.current?.focus?.()
    }
  }, [open])

  // Escape closes; Tab cycles inside the panel instead of escaping to the page.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // A static export prerenders this module; there is no document at that point.
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        // Decorative: the dialog already has an accessible name, and a second
        // labelled element here would be announced as a stray button.
        aria-hidden="true"
        onClick={close}
        className={
          backdropClassName ??
          'absolute inset-0 bg-ink/40 transition-opacity duration-[var(--duration-base)]'
        }
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={className}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
