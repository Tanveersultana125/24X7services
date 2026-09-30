'use client'

import { Trash2 } from 'lucide-react'
import { Button, Sheet } from '@/components/ui'

/** The bin key on an AI history row. Sits outside the row's link. */
export function DeleteKey({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 shrink-0 place-items-center rounded-xl text-faint transition-colors hover:bg-danger-soft hover:text-danger"
    >
      <Trash2 className="size-[18px]" />
    </button>
  )
}

/** Asks before anything is removed — there is no way to bring it back. */
export function ConfirmDelete({
  open,
  title,
  body,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{body}</p>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" className="flex-1" onClick={onConfirm}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
    </Sheet>
  )
}
