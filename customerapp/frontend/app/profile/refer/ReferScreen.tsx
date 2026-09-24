'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronDown, Gift, Ticket, UserRoundPlus } from 'lucide-react'
import {
  REFERRAL_REWARD,
  REFERRAL_WELCOME,
  formatPaise,
  normaliseReferralCode,
  referralCodeSchema,
} from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { ReferCard } from '@/components/ReferCard'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Your code, the ways to send it, and what it has earned.
 *
 * The promise is written the way the code actually pays: both people are
 * credited when the person who used it has had a job *finished*. Not on
 * sign-up, not on booking. "Get ₹250 when your friend signs up" and paying
 * three weeks later is how a referral scheme turns into a support queue, so
 * the sentence and the server agree here, word for word.
 *
 * The code is made by the server the first time this screen is opened. There
 * is nothing to generate, claim or activate — it exists because you asked to
 * see it, which is the only moment anyone needs one.
 *
 * Sending it is named channels rather than one Share button, because a share
 * sheet is a list of forty apps between somebody and the one they were always
 * going to use. WhatsApp is first and it is not a close-run thing here. The
 * sheet is still there, last, for everyone the three do not cover.
 */
export function ReferScreen() {
  return (
    <ProfileShell
      title="Refer & earn"
      signedOut={
        <SignInPrompt
          icon={Gift}
          title="Your referral code"
          description="Refer a friend and you both get credits once their first job is finished. Log in for your code."
        />
      }
    >
      {() => <Refer />}
    </ProfileShell>
  )
}

function Refer() {
  const load = useCallback(() => callFn('getReferral', {}), [])
  const referral = useAsync(load)

  if (referral.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your code" className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-24" />
      </SkeletonGroup>
    )
  }

  if (referral.status === 'error' || !referral.data) {
    return (
      <ErrorState
        className="py-16"
        onRetry={referral.reload}
        retrying={referral.refreshing}
      />
    )
  }

  const { code, invited, earned, canApplyCode, usedCode } = referral.data

  return (
    <>
      <ReferCard code={code} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat
          icon={UserRoundPlus}
          label="Friends who booked"
          value={String(invited)}
        />
        <Stat icon={Gift} label="You have earned" value={formatPaise(earned)} />
      </div>

      <HowItWorks />

      <Faq />

      <Band />

      {canApplyCode ? (
        <ApplyCode onApplied={referral.reload} />
      ) : (
        <section>
          <h2 className="text-lg font-bold text-ink">
            Using someone&apos;s code
          </h2>
          <p className="mt-2 text-sm text-muted">
            {usedCode
              ? 'You have already used a referral code on this account. One per customer.'
              : 'A referral code only works before your first booking, and you have already booked with us.'}
          </p>
        </section>
      )}

      <p className="mt-6 pb-6 text-center text-sm">
        <Link
          href={'/legal/terms' as Route}
          className="font-semibold text-brand"
        >
          Terms and conditions
        </Link>
      </p>
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gift
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-card border border-border p-4">
      <Icon className="size-5 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink tabular-nums">{value}</p>
    </div>
  )
}

/**
 * The three steps, in a card, with the line that makes them a sequence.
 *
 * The third one is the one that matters and it is worded to be impossible to
 * misread: the money arrives when the job is done, not when somebody signs up.
 */
function HowItWorks() {
  const steps = [
    {
      title: 'Send your code',
      body: 'To anyone who has not booked with 24X7 before.',
    },
    {
      title: 'They enter it before their first booking',
      body: 'Under Profile, Refer & earn. It only works before that first job.',
    },
    {
      title: 'Their first job gets finished',
      body: `That is when we pay — ${formatPaise(REFERRAL_REWARD)} to you and ${formatPaise(
        REFERRAL_WELCOME
      )} to them, as credits. Not before, because a booking that never happened is not a referral.`,
    },
  ]

  return (
    <section className="mt-6 rounded-card bg-surface p-5">
      <h2 className="text-lg font-bold text-ink">How it works</h2>
      <ol className="mt-4 flex flex-col">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex flex-col items-center" aria-hidden="true">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg text-sm font-bold text-ink">
                {index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span className="w-px flex-1 bg-border" />
              ) : null}
            </span>
            <span
              className={cn('min-w-0', index < steps.length - 1 && 'pb-5')}
            >
              <span className="block text-base font-semibold text-ink">
                {step.title}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                {step.body}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * The questions a referral scheme raises by existing.
 *
 * Every answer here is a rule the server actually enforces — one code per
 * account, before the first booking, paid on completion. A scheme whose small
 * print is looser than its code is a scheme that pays people who read it
 * carefully.
 */
const FAQ = [
  {
    q: 'When exactly do I get paid?',
    a: 'When the person who used your code has had their first job finished. Not when they sign up, and not when they book — a booking that gets cancelled has cost nobody anything.',
  },
  {
    q: 'How many people can use my code?',
    a: 'As many as you like. You are paid once for each of them, the first time each one has a job finished.',
  },
  {
    q: 'Can I use my own code?',
    a: 'No. A code cannot be used on the account that owns it, and it only works on an account that has never booked with us.',
  },
  {
    q: 'Where does the money go?',
    a: 'Onto your 24X7 balance as credits, which come off your next bill. Like the rest of the balance it never expires, and it can only be spent on 24X7 services.',
  },
  {
    q: 'Can I use more than one code myself?',
    a: 'One per account. If you have already used one, the box on this screen is gone rather than waiting to refuse you.',
  },
] as const

function Faq() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-ink">Questions</h2>
      <ul className="mt-2 divide-y divide-border border-y border-border">
        {FAQ.map((item) => (
          <li key={item.q}>
            {/* Native details: open before hydration, searchable by the
                browser's own find, and announced without being told how. */}
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-fast)] group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The box for somebody else's code.
 *
 * Shown only while it can still work — before a first booking, and only once.
 * A field that takes a code and then explains why it was refused is a worse
 * screen than one that says up front that the moment has passed.
 */
function ApplyCode({ onApplied }: { onApplied: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (busy) return

    const code = normaliseReferralCode(value)
    const parsed = referralCodeSchema.safeParse(code)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'That is not a valid code.')
      return
    }

    setError(undefined)
    setBusy(true)
    try {
      await callFn('applyReferralCode', { code: parsed.data })
      toast.show(
        'Code applied. You will both be credited once your first job is done.',
        { tone: 'success' }
      )
      setValue('')
      onApplied()
    } catch (caught) {
      setError(friendlyError(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-ink">Have someone&apos;s code?</h2>
      <p className="mt-1 text-sm text-muted">
        Enter it before your first booking and you both get{' '}
        {formatPaise(REFERRAL_WELCOME)} once that job is finished.
      </p>

      <form onSubmit={(event) => void submit(event)} className="mt-3 flex flex-col gap-3">
        <Input
          label="Referral code"
          hideLabel
          placeholder="24X7-ABCDEF"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          className="font-mono tracking-[0.12em] uppercase"
        />
        <Button
          type="submit"
          loading={busy}
          disabled={value.trim().length === 0}
          iconLeft={<Ticket className="size-4" aria-hidden="true" />}
        >
          Apply code
        </Button>
      </form>
    </section>
  )
}

function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}
