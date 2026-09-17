'use client'

import Image from 'next/image'
import { MessageSquare, Phone, Star } from 'lucide-react'
import type { TechnicianPublic } from '@app/shared'
import { Card, CardButton } from '@/components/ui/Card'
import { Tag } from '@/components/ui/Chip'
import { cn } from '@/lib/cn'

/**
 * The expert, as the customer sees them: name, rating, jobs done, the brands
 * they know. Nothing else about a technician reaches the client.
 *
 * The call button dials `maskedNumber`, which the backend hands over per
 * booking. The technician's real number is never in the document, so there is
 * nothing here to leak even if the rules were wrong.
 */

export interface TechnicianCardProps {
  technician: TechnicianPublic
  /** Brand names keyed by id, so the card can show "Samsung · LG". */
  brandNames?: Readonly<Record<string, string>>
  onSelect?: (technician: TechnicianPublic) => void
  selected?: boolean
  /** Only once a technician is assigned to a live booking. */
  maskedNumber?: string
  onMessage?: () => void
  className?: string
}

export function TechnicianCard({
  technician,
  brandNames,
  onSelect,
  selected = false,
  maskedNumber,
  onMessage,
  className,
}: TechnicianCardProps) {
  const specialisms = technician.specializations
    .map((id) => brandNames?.[id] ?? id.toUpperCase())
    .join(' · ')

  const body = (
    <div className="flex items-start gap-3 p-4">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface">
        {technician.photo ? (
          <Image
            src={technician.photo}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-base font-bold text-muted">
            {technician.name.charAt(0)}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-ink">
          {technician.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <Star
            className="size-3.5 fill-ink text-ink"
            aria-hidden="true"
          />
          <span className="font-medium text-ink">
            {technician.rating.toFixed(1)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{technician.jobsCount} jobs</span>
        </p>
        {specialisms ? (
          <Tag className="mt-2">{specialisms}</Tag>
        ) : null}
      </div>
    </div>
  )

  if (onSelect) {
    return (
      <CardButton
        onClick={() => onSelect(technician)}
        selected={selected}
        ariaLabel={`${technician.name}, rated ${technician.rating.toFixed(1)}, ${technician.jobsCount} jobs`}
        className={className}
      >
        {body}
      </CardButton>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {body}
      {maskedNumber || onMessage ? (
        <div className="flex gap-2 border-t border-border p-3">
          {maskedNumber ? (
            <a
              href={`tel:${maskedNumber}`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill border border-ink text-sm font-semibold text-ink"
            >
              <Phone className="size-4" aria-hidden="true" />
              Call
            </a>
          ) : null}
          {onMessage ? (
            <button
              type="button"
              onClick={onMessage}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill border border-border text-sm font-semibold text-ink"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              Message
            </button>
          ) : null}
        </div>
      ) : null}
      {maskedNumber ? (
        <p className="px-3 pb-3 text-xs text-muted">
          Calls go through a masked number. Neither side sees the other&apos;s
          real phone number.
        </p>
      ) : null}
    </Card>
  )
}
