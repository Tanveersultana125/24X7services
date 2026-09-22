'use client'

import { useState } from 'react'
import {
  Copy,
  Gift,
  Link2,
  MessageCircle,
  MessageSquare,
  Share2,
} from 'lucide-react'
import { REFERRAL_WELCOME, formatPaise, referralShareText } from '@app/shared'

import { useToast } from '@/components/Toast'
import { copyText, shareText } from '@/lib/share'
import { cn } from '@/lib/cn'

/**
 * The offer, the code, and the ways to send it — one block, because they are
 * one thought: here is what it is worth, here is the thing to send, here is
 * how to send it.
 *
 * Brand colours and the same speckle as the balance card, because this is the
 * other screen in the app that hands a customer a number worth money, and a
 * second decorative treatment invented for one card is how a design system
 * starts leaking.
 */
export function ReferCard({ code }: { code: string }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const url =
    typeof window !== 'undefined' ? window.location.origin : 'https://24x7.app'
  const message = referralShareText(code, url)

  async function sheet(): Promise<void> {
    if (busy) return
    setBusy(true)
    const outcome = await shareText(message, 'Try 24X7')
    setBusy(false)
    if (outcome === 'copied') {
      toast.show('Invite copied. Paste it wherever you like.', { tone: 'success' })
    } else if (outcome === 'failed') {
      toast.show('We could not open the share sheet. Copy the code instead.', {
        tone: 'error',
      })
    }
    // 'shared' and 'dismissed' are the customer's own doing — nothing to say.
  }

  async function copyLink(): Promise<void> {
    const outcome = await copyText(message)
    toast.show(
      outcome === 'copied' ? 'Invite copied.' : 'We could not copy that.',
      { tone: outcome === 'copied' ? 'success' : 'error' }
    )
  }

  async function copyCode(): Promise<void> {
    const outcome = await copyText(code)
    toast.show(
      outcome === 'copied' ? `${code} copied` : 'We could not copy that.',
      { tone: outcome === 'copied' ? 'success' : 'error' }
    )
  }

  return (
    <div className="relative mt-5 overflow-hidden rounded-card bg-linear-to-br from-brand-deep to-brand text-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-56 opacity-25 [background-image:radial-gradient(circle,var(--color-bg)_1.5px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]"
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-snug">
              Refer a friend, you both get{' '}
              {formatPaise(REFERRAL_WELCOME)}
            </p>
            <p className="mt-2 max-w-[22rem] text-sm text-bg/80">
              Credits land on both balances once their first job is finished —
              not when they sign up.
            </p>
          </div>
          <Gift className="size-10 shrink-0 text-bg/70" aria-hidden="true" />
        </div>

        {/* The code as a thing you can press, because the first instinct is to
            grab it rather than to read it. */}
        <button
          type="button"
          onClick={() => void copyCode()}
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-card border border-dashed border-bg/40 px-4 py-3 text-left hover:bg-bg/10"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold tracking-[0.08em] uppercase text-bg/70">
              Your code
            </span>
            <span className="mt-0.5 block font-mono text-xl font-bold tracking-[0.12em]">
              {code}
            </span>
          </span>
          <Copy className="size-5 shrink-0 text-bg/80" aria-hidden="true" />
        </button>
      </div>

      <div className="relative border-t border-bg/20 px-5 py-4">
        <p className="text-center text-xs font-semibold tracking-[0.06em] uppercase text-bg/70">
          Refer via
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Channel
            icon={MessageCircle}
            label="WhatsApp"
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          />
          <Channel
            icon={MessageSquare}
            label="SMS"
            href={`sms:?body=${encodeURIComponent(message)}`}
          />
          <Channel icon={Link2} label="Copy link" onClick={() => void copyLink()} />
          <Channel
            icon={Share2}
            label="More"
            onClick={() => void sheet()}
            disabled={busy}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * One way to send the invite.
 *
 * A link where the channel is a URL the operating system knows how to open,
 * and a button where it is something this app does. They are drawn the same
 * because to a customer they are the same thing: a way to get the code to
 * somebody.
 */
function Channel({
  icon: Icon,
  label,
  href,
  onClick,
  disabled = false,
}: {
  icon: typeof Share2
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const body = (
    <>
      <span className="flex size-11 items-center justify-center rounded-full bg-bg text-brand">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xs font-medium text-bg/90">{label}</span>
    </>
  )

  const classes = cn(
    'flex min-w-0 flex-col items-center gap-1.5 rounded-card py-1',
    disabled ? 'opacity-60' : 'hover:bg-bg/10'
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Refer via ${label}`}
        className={classes}
      >
        {body}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Refer via ${label}`}
      className={classes}
    >
      {body}
    </button>
  )
}
