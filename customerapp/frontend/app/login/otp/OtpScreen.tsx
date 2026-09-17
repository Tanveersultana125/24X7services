'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { COL } from '@app/shared'

import { Header } from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/OtpInput'
import {
  authErrorMessage,
  OTP_IS_SIMULATED,
  startPhoneSignIn,
} from '@/lib/auth'
import { db } from '@/lib/firebase'
import { formatPhone } from '@/lib/format'
import {
  clearPendingSignIn,
  safeNext,
  setPendingSignIn,
  takePendingSignIn,
} from '@/lib/pendingSignIn'

/** Long enough that the SMS has really had a chance to arrive. */
const RESEND_SECONDS = 30

/**
 * The code.
 *
 * It submits itself once the last digit lands, because asking someone to type
 * six digits and then find a button is one step too many — and the button
 * stays, for anyone who pastes.
 *
 * This screen cannot stand on its own: the verification it needs is a live
 * object held in memory by the previous screen. Arriving here by reload or deep
 * link finds nothing, says so, and offers the way back.
 */
export function OtpScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const pending = takePendingSignIn()

  // Held in a ref so the countdown effect does not restart on every tick.
  const submitted = useRef(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  const verify = useCallback(
    async (value: string) => {
      if (!pending || submitted.current) return
      submitted.current = true
      setChecking(true)
      setError(undefined)
      try {
        await pending.verification.confirm(value)
        clearPendingSignIn()
        // A customer who has never given a name goes and gives one; everyone
        // else goes straight back to whatever they were doing.
        router.replace(
          (await hasName())
            ? next
            : (`/login/name?next=${encodeURIComponent(next)}` as Route)
        )
      } catch (caught) {
        setError(authErrorMessage(caught))
        setCode('')
        submitted.current = false
      } finally {
        setChecking(false)
      }
    },
    [pending, next, router]
  )

  async function resend(): Promise<void> {
    if (!pending) return
    setResending(true)
    setError(undefined)
    try {
      const verification = await startPhoneSignIn(pending.phoneE164)
      setPendingSignIn({ phoneE164: pending.phoneE164, verification })
      setSecondsLeft(RESEND_SECONDS)
      setCode('')
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setResending(false)
    }
  }

  if (!pending) {
    return (
      <div className="min-h-dvh bg-bg">
        <Header title="Enter the code" showBack backFallback="/login" />
        <main className="mx-auto w-full max-w-lg px-4 lg:max-w-md">
          <p className="mt-6 text-sm text-muted">
            This sign-in has expired. Please enter your number again.
          </p>
          <Button
            className="mt-4"
            fullWidth
            onClick={() => router.replace('/login')}
          >
            Back to sign in
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Header title="Enter the code" showBack backFallback="/login" />

      <main className="mx-auto w-full max-w-lg px-4 pb-12 lg:max-w-md">
        <p className="mt-4 text-sm leading-relaxed text-muted">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-ink">
            {formatPhone(pending.phoneE164)}
          </span>
          .
        </p>

        <OtpInput
          className="mt-6"
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(undefined)
          }}
          onComplete={(value) => void verify(value)}
          error={error}
          disabled={checking}
          autoFocus
        />

        <Button
          className="mt-6"
          fullWidth
          size="lg"
          loading={checking}
          disabled={code.length < 6}
          onClick={() => void verify(code)}
        >
          Verify and continue
        </Button>

        <div className="mt-4 text-center text-sm text-muted">
          {secondsLeft > 0 ? (
            <span>Resend in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              disabled={resending}
              className="font-semibold text-ink underline disabled:text-muted"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        {OTP_IS_SIMULATED ? (
          <p className="mt-6 rounded-card border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
            The emulator prints the code rather than sending it. Look in the
            terminal running the emulators, or the Auth tab at localhost:4000.
          </p>
        ) : null}
      </main>
    </div>
  )
}

/**
 * Whether this customer has told us their name before.
 *
 * The auth trigger writes the user document a moment after sign-in, so this
 * can legitimately find nothing at all. Both "no document" and "no name" mean
 * the same thing here, and a read that fails means the same again — asking a
 * returning customer for their name once more is a smaller cost than skipping
 * the question for someone who has never answered it.
 */
async function hasName(): Promise<boolean> {
  const { auth } = await import('@/lib/firebase')
  const uid = auth().currentUser?.uid
  if (!uid) return false
  try {
    const snap = await getDoc(doc(db(), COL.users, uid))
    const name = snap.data()?.name
    return typeof name === 'string' && name.trim().length > 0
  } catch {
    return false
  }
}
