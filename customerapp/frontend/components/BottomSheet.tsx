'use client'

import { useId } from 'react'
import { X } from 'lucide-react'
import { Overlay } from '@/components/ui/Overlay'
import { cn } from '@/lib/cn'

/**
 * A panel that rises from the bottom edge. Used where a Modal would be wrong on
 * a phone: a long list to pick from, a filter, an address book — anything the
 * customer scrolls rather than answers.
 *
 * From 640px up it centres itself as a dialog, because a sheet pinned to the
 * bottom of a desktop window is a long way from where the eye already is.
 */

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  dismissable?: boolean
  /** A sticky row at the foot of the sheet — usually a single confirm button. */
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  dismissable = true,
  footer,
  children,
  className,
}: BottomSheetProps) {
  const titleId = useId()
  const descId = useId()

  return (
    <Overlay
      open={open}
      onClose={onClose}
      dismissable={dismissable}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      className={cn(
        'relative mt-auto flex w-full flex-col bg-bg',
        'max-h-[85dvh] rounded-t-[1.25rem] border-t border-border',
        'pb-[var(--safe-bottom)]',
        // Above the phone breakpoint it stops being a sheet.
        'sm:m-auto sm:max-w-md sm:rounded-card sm:border sm:shadow-raised',
        className
      )}
    >
      {/* The grabber. Decorative — dragging is not wired up, and a sheet that
          looks draggable but is not would be worse than one that does not. */}
      <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
        <span className="h-1 w-10 rounded-full bg-border" />
      </div>

      <div className="flex items-start gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-1 text-sm text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {dismissable ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2 flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>

      {footer ? (
        <div className="border-t border-border p-4">{footer}</div>
      ) : null}
    </Overlay>
  )
}
