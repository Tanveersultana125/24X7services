'use client'

import { useId } from 'react'
import { X } from 'lucide-react'
import { Overlay } from '@/components/ui/Overlay'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * A centred dialog for a decision the customer has to make before anything
 * else happens: confirm a cancellation, approve a repair, delete an account.
 *
 * It is not for information. Anything the customer can read and move on from
 * belongs on the page or in a toast.
 */

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** Off while a request is in flight, so a stray tap cannot abandon it. */
  dismissable?: boolean
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  dismissable = true,
  children,
  footer,
  className,
}: ModalProps) {
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
        'relative m-auto w-full max-w-md rounded-card border border-border bg-bg shadow-raised',
        'max-h-[calc(100dvh-4rem)] overflow-y-auto',
        className
      )}
    >
      <div className="flex items-start gap-3 p-5 pb-3">
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

      {children ? <div className="px-5 pb-4">{children}</div> : null}

      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      ) : null}
    </Overlay>
  )
}

/**
 * The shape almost every confirmation takes. `destructive` is what separates
 * "Reschedule" from "Cancel this booking" — one is reversible, the other costs
 * money and a slot.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  destructive = false,
  loading = false,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  children?: React.ReactNode
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      dismissable={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
