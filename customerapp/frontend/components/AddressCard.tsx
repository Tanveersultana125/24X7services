'use client'

import { Briefcase, Home, MapPin, Pencil, Trash2 } from 'lucide-react'
import type { Address } from '@app/shared'
import { Card, CardButton } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Chip'
import { cn } from '@/lib/cn'

/**
 * A saved address, either as something to pick during booking or as a row in
 * the address book.
 *
 * `serviceable` is passed in rather than worked out here: whether a pincode is
 * covered is a backend answer, and a card that guessed it would show a
 * different verdict from the one createBooking gives.
 */

const icons = {
  home: Home,
  office: Briefcase,
  other: MapPin,
} as const

export interface AddressCardProps {
  address: Address
  onSelect?: (address: Address) => void
  selected?: boolean
  onEdit?: (address: Address) => void
  onDelete?: (address: Address) => void
  isDefault?: boolean
  /** False greys the card and blocks selection, with a reason underneath. */
  serviceable?: boolean
  className?: string
}

export function AddressCard({
  address,
  onSelect,
  selected = false,
  onEdit,
  onDelete,
  isDefault = false,
  serviceable = true,
  className,
}: AddressCardProps) {
  const Icon = icons[address.label]
  const name =
    address.label === 'other'
      ? (address.customLabel ?? 'Other')
      : address.label === 'home'
        ? 'Home'
        : 'Office'

  const body = (
    <div className="flex items-start gap-3 p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{name}</h3>
          {isDefault ? <Tag>Default</Tag> : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {address.flat}, {address.area}
          {address.landmark ? `, near ${address.landmark}` : ''}
          <br />
          {address.city} {address.pincode}
        </p>
        {!serviceable ? (
          <p className="mt-2 text-xs font-medium text-warning">
            We do not service this pincode yet.
          </p>
        ) : null}
      </div>
    </div>
  )

  if (onSelect) {
    return (
      <CardButton
        onClick={() => onSelect(address)}
        selected={selected}
        disabled={!serviceable}
        ariaLabel={`${name}, ${address.area}, ${address.pincode}`}
        className={className}
      >
        {body}
      </CardButton>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {body}
      {onEdit || onDelete ? (
        <div className="flex gap-1 border-t border-border px-2 py-1">
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(address)}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-card text-sm font-medium text-ink hover:bg-surface"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(address)}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-card text-sm font-medium text-error hover:bg-error-soft"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
