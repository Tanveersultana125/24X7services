'use client'

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Send,
} from 'lucide-react'
import { BottomSheet } from '@/components/BottomSheet'
import { useToast } from '@/components/Toast'
import { copyText } from '@/lib/share'
import { cn } from '@/lib/cn'

/**
 * Sharing a page, in the app's own panel rather than the system's.
 *
 * The system share dialog looks different on every phone and every desktop —
 * on Windows it is a window of Microsoft accounts and Teams — and none of it
 * is ours to style. This is the same everywhere: the link as a card at the
 * top with a copy button, then the places people actually send a link to,
 * each a plain web link that opens that app with the message filled in, and
 * "More" for the system dialog where there is one.
 *
 * Nothing is sent from here; every target opens somewhere the customer then
 * presses send themselves.
 */
export function ShareSheet({
  open,
  onClose,
  title,
  text,
  url,
  image,
}: {
  open: boolean
  onClose: () => void
  /** What is being shared: "Washing Machine". */
  title: string
  /** The line that goes with the link. */
  text: string
  url: string
  /** A picture for the preview card. */
  image?: string
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const message = `${text} ${url}`
  // False in the prerender, which has no navigator to ask.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => 'share' in navigator,
    () => false
  )

  async function copy(): Promise<void> {
    const outcome = await copyText(url)
    if (outcome === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.show('We could not copy that.', { tone: 'error' })
    }
  }

  async function more(): Promise<void> {
    try {
      await navigator.share({ title, text, url })
      onClose()
    } catch {
      // Closed without sharing, or refused; the panel stays open.
    }
  }

  const targets: ReadonlyArray<{
    key: string
    label: string
    href: string
    tint: string
    icon: React.ReactNode
  }> = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
      tint: 'bg-[#25D366]',
      icon: <MessageCircle className="size-6" aria-hidden="true" />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      tint: 'bg-[#1877F2]',
      icon: <span className="text-2xl font-bold leading-none">f</span>,
    },
    {
      key: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      // Ringed, so the black disc still reads on the dark theme's ground.
      tint: 'bg-night ring-1 ring-white/20',
      icon: <span className="text-xl font-bold leading-none">𝕏</span>,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      tint: 'bg-[#229ED9]',
      icon: <Send className="size-5" aria-hidden="true" />,
    },
    {
      key: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
      tint: 'bg-[#EA4335]',
      icon: <Mail className="size-5" aria-hidden="true" />,
    },
    {
      key: 'sms',
      label: 'Messages',
      href: `sms:?&body=${encodeURIComponent(message)}`,
      tint: 'bg-success',
      icon: <MessageSquare className="size-5" aria-hidden="true" />,
    },
  ]

  return (
    <BottomSheet open={open} onClose={onClose} title="Share">
      {/* The link, as the person receiving it will see it. */}
      <div className="flex items-center gap-3 rounded-card border border-border p-3">
        {image ? (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-plate">
            <Image src={image} alt="" fill sizes="56px" className="object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">{title}</p>
          <p className="truncate text-sm text-muted">{url.replace(/^https?:\/\//, '')}</p>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border px-4 text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
            copied
              ? 'border-success bg-success-soft text-success'
              : 'border-border text-brand hover:border-brand'
          )}
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>

      <p className="mt-6 text-sm font-semibold text-muted">Share via</p>
      <ul className="mt-4 grid grid-cols-4 gap-y-5">
        {targets.map((target) => (
          <li key={target.key}>
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-full text-white transition-transform duration-[var(--duration-fast)] group-active:scale-95',
                  target.tint
                )}
              >
                {target.icon}
              </span>
              <span className="text-xs text-ink">{target.label}</span>
            </a>
          </li>
        ))}
        {canShare ? (
          <li>
            <button
              type="button"
              onClick={() => void more()}
              className="group flex w-full flex-col items-center gap-2 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-surface text-ink transition-transform duration-[var(--duration-fast)] group-active:scale-95">
                <MoreHorizontal className="size-6" aria-hidden="true" />
              </span>
              <span className="text-xs text-ink">More</span>
            </button>
          </li>
        ) : null}
      </ul>
    </BottomSheet>
  )
}

/** Whether a share sheet exists does not change while the page is open. */
function noSubscription(): () => void {
  return () => {}
}
