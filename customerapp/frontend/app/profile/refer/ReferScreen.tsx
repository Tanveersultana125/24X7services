'use client'

import { useCallback, useState } from 'react'
import { Copy, Gift, Share2, Ticket, UserRoundPlus } from 'lucide-react'
import {
  REFERRAL_REWARD,
  REFERRAL_WELCOME,
  formatPaise,
  normaliseReferralCode,
  referralCodeSchema,
  referralShareText,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { copyText, shareText } from '@/lib/share'
import { useAsync } from '@/lib/useAsync'

/**
 * Your code, what it has earned, and the box for somebody else's.
 *
 * The promise on this screen is written the way the code actually pays: both
 * people are credited when the person who used the code has had a job
 * *finished*. Not on sign-up, not on booking. Saying "get ₹250 when your friend
 * signs up" and paying three weeks later is how a referral scheme turns into a
 * support queue, so the sentence and the server agree here, word for word.
 *
 * The code is made by the server the first time this screen is opened. There is
 * nothing to generate, claim or activate — it exists because you asked to see
 * it, which is the only moment anyone needs one.
 */
export function ReferScreen() {
  return <ProfileShell title="Refer a friend">{() => <Refer />}</ProfileShell>
}

function Refer() {
  const load = useCallback(() => callFn('getReferral', {}), [])
  const referral = useAsync(load)

  if (referral.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your code" className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-52" />
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
      <CodeCard code={code} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat
          icon={UserRoundPlus}
          label="Friends who booked"
          value={String(invited)}
        />
        <Stat icon={Gift} label="You have earned" value={formatPaise(earned)} />
      </div>

      <Band />

      <section>
        <h2 className="text-lg font-bold text-ink">How it works</h2>
        <ol className="mt-3 flex flex-col gap-4">
          <Step
            n={1}
            title="Send them your code"
            body="Anyone who has not booked with 24X7 before can use it."
          />
          <Step
            n={2}
            title="They enter it before their first booking"
            body="On this screen, in the box at the bottom. It only works before their first job."
          />
          <Step
            n={3}
            title="Their first job gets finished"
            body={`That is when we pay — ${formatPaise(REFERRAL_REWARD)} to you and ${formatPaise(
              REFERRAL_WELCOME
            )} to them, as credits on your balances. Not before, because a booking that never happened is not a referral.`}
          />
        </ol>
      </section>

      <Band />

      {canApplyCode ? (
        <ApplyCode onApplied={referral.reload} />
      ) : (
        <section className="pb-6">
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
    </>
  )
}

/**
 * The code itself, as the one thing on the screen allowed to be large.
 *
 * Brand colours and the same speckle as the balance card, because this is the
 * other screen in the app that hands a customer a number worth money — and a
 * second decorative treatment invented for one card is how a design system
 * starts leaking.
 */
function CodeCard({ code }: { code: string }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const url =
    typeof window !== 'undefined' ? window.location.origin : 'https://24x7.app'
  const message = referralShareText(code, url)

  async function send(): Promise<void> {
    if (busy) return
    setBusy(true)
    const outcome = await shareText(message, 'Try 24X7')
    setBusy(false)
    if (outcome === 'copied') {
      toast.show('Invite copied. Paste it wherever you like.', { tone: 'success' })
    } else if (outcome === 'failed') {
      toast.show('We could not open the share sheet. Long-press the code to copy it.', {
        tone: 'error',
      })
    }
    // 'shared' and 'dismissed' are both the customer's own doing — nothing to say.
  }

  async function copy(): Promise<void> {
    const outcome = await copyText(code)
    toast.show(
      outcome === 'copied' ? `${code} copied` : 'We could not copy that.',
      { tone: outcome === 'copied' ? 'success' : 'error' }
    )
  }

  return (
    <div className="relative mt-5 overflow-hidden rounded-card bg-linear-to-br from-brand-deep to-brand p-5 text-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-56 opacity-25 [background-image:radial-gradient(circle,var(--color-bg)_1.5px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_70%)]"
      />

      <p className="relative text-sm font-semibold tracking-[0.06em] uppercase">
        Refer &amp; earn
      </p>
      <p className="relative mt-2 max-w-[20rem] text-2xl font-bold leading-snug">
        {formatPaise(REFERRAL_REWARD)} for you, {formatPaise(REFERRAL_WELCOME)}{' '}
        for them
      </p>
      <p className="relative mt-1 text-sm text-bg/80">
        Paid when their first job is finished.
      </p>

      <p className="relative mt-6 text-xs font-semibold tracking-[0.08em] uppercase text-bg/70">
        Your code
      </p>
      <p className="relative mt-0.5 font-mono text-2xl font-bold tracking-[0.12em]">
        {code}
      </p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-pill bg-bg px-5 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share invite
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-11 items-center gap-2 rounded-pill border border-bg/40 px-5 text-sm font-semibold text-bg hover:bg-bg/10"
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy code
        </button>
      </div>
    </div>
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

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
    </li>
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
        `Code applied. You will both be credited once your first job is done.`,
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
    <section className="pb-6">
      <h2 className="text-lg font-bold text-ink">
        Have someone&apos;s code?
      </h2>
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
