'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import type { Booking, OtpKind } from '@app/shared'

import { OtpDisplay } from '@/components/OtpInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { callFn, friendlyError } from '@/lib/callables'
import { cn } from '@/lib/cn'

/**
 * The code the customer reads out to the expert.
 *
 * Not shown until asked for. A four-digit code sitting on screen while a
 * stranger is in the room is a code that can be read over a shoulder, and the
 * server records the moment it was revealed — which is the only evidence either
 * side has if it is later disputed. Revealing it automatically would make that
 * record meaningless.
 *
 * Which code is offered follows the job: the start code while the expert is on
 * their way or at the door, the completion code once work is under way. There
 * is never more than one on screen, because there is never more than one that
 * means anything.
 */

const PROMPT: Record<OtpKind, { title: string; note: string; caption: string }> = {
  start: {
    title: 'Start code',
    note: 'Read this out to your expert before they begin. It confirms they are at the right address.',
    caption: 'Read this out to start the job',
  },
  complete: {
    title: 'Completion code',
    note: 'Read this out once you are happy the job is done. Nothing is closed without it.',
    caption: 'Read this out to close the job',
  },
}

function kindFor(booking: Booking): OtpKind | null {
  switch (booking.status) {
    case 'assigned':
    case 'en_route':
    case 'arrived':
      return 'start'
    case 'in_progress':
    case 'awaiting_approval':
      return 'complete'
    default:
      return null
  }
}

export function JobOtpPanel({
  booking,
  className,
}: {
  booking: Booking
  className?: string
}) {
  const kind = kindFor(booking)
  const [otp, setOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!kind) return null
  const prompt = PROMPT[kind]

  async function reveal(): Promise<void> {
    if (!kind) return
    setLoading(true)
    setError(null)
    try {
      const result = await callFn('getJobOtp', { bookingId: booking.id, kind })
      setOtp(result.otp)
    } catch (caught) {
      setError(friendlyError(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{prompt.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            {prompt.note}
          </p>
        </div>
      </div>

      {otp ? (
        <OtpDisplay className="mt-4" otp={otp} caption={prompt.caption} />
      ) : (
        <Button
          className="mt-3"
          variant="secondary"
          fullWidth
          loading={loading}
          onClick={reveal}
        >
          Show my code
        </Button>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
    </Card>
  )
}
