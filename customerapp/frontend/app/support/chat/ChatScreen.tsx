'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { supportCategorySchema, type SupportCategory } from '@app/shared'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { cn } from '@/lib/cn'
import { CardButton } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'

/**
 * Starting a conversation.
 *
 * The category is asked first because it decides who picks the thread up and
 * what the first reply can usefully say. Six options, each named as a customer
 * would describe their problem rather than as the business files it.
 *
 * A booking can be attached, and usually should be — almost every support
 * question is about a specific job, and a thread that names one saves the first
 * three messages of every conversation.
 */

const CATEGORIES: ReadonlyArray<{
  value: SupportCategory
  title: string
  detail: string
}> = [
  {
    value: 'booking',
    title: 'A booking',
    detail: 'The time, the address, or nobody turned up',
  },
  {
    value: 'payment',
    title: 'A payment',
    detail: 'A charge, a refund, or an invoice',
  },
  {
    value: 'technician',
    title: 'The expert',
    detail: 'How the visit went, or who came',
  },
  {
    value: 'warranty',
    title: 'A warranty',
    detail: 'The same fault has come back',
  },
  {
    value: 'brand_not_listed',
    title: 'A brand you do not list',
    detail: 'Ask whether we can still help',
  },
  {
    value: 'account',
    title: 'Your account',
    detail: 'Signing in, your details, closing it',
  },
  {
    value: 'other',
    title: 'Something else',
    detail: 'Anything that does not fit above',
  },
]

const MAX = 2000

export function ChatScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()

  // Arriving from a booking carries it through, so the thread knows which job
  // it is about without anyone typing a reference.
  const bookingId = params.get('booking')
  const initialCategory = supportCategorySchema.safeParse(params.get('about'))

  const [category, setCategory] = useState<SupportCategory | null>(
    initialCategory.success ? initialCategory.data : null
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [sending, setSending] = useState(false)

  async function start(): Promise<void> {
    if (!category) {
      setError('Pick what this is about')
      return
    }
    if (message.trim().length === 0) {
      setError('Tell us what happened')
      return
    }

    setSending(true)
    try {
      const result = await callFn('createSupportTicket', {
        category,
        message: message.trim(),
        ...(bookingId ? { bookingId } : {}),
      })
      router.replace(
        `/support/tickets/detail?id=${result.ticketId}` as Route
      )
    } catch (caught) {
      toast.show(friendlyError(caught), { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Header title="Tell us what happened" showBack backFallback="/support" />

      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-muted">
            What is this about?
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {CATEGORIES.map((option) => (
              <CardButton
                key={option.value}
                onClick={() => {
                  setCategory(option.value)
                  setError(undefined)
                }}
                selected={category === option.value}
                className="p-4"
              >
                <p className="text-sm font-semibold text-ink">{option.title}</p>
                <p className="mt-0.5 text-sm text-muted">{option.detail}</p>
              </CardButton>
            ))}
          </div>
        </fieldset>

        <Textarea
          className="mt-6"
          label="What happened?"
          required
          value={message}
          onChange={(event) => {
            setMessage(event.target.value.slice(0, MAX))
            setError(undefined)
          }}
          error={error}
          hint={
            bookingId
              ? 'This conversation is attached to the booking you came from.'
              : `In your own words. ${MAX - message.length} characters left.`
          }
          placeholder="The expert was due between 11 and 1 and nobody arrived."
          rows={5}
        />

        <Button
          className="mt-6"
          fullWidth
          size="lg"
          loading={sending}
          onClick={() => void start()}
        >
          Send
        </Button>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          You will get a first answer straight away, and a person any time you
          ask for one.
        </p>
      </main>

      <BottomNavigation />
    </div>
  )
}
