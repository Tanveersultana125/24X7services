'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { ShieldCheck } from 'lucide-react'
import { phoneSchema } from '@app/shared'

import { AuthShell, DevNote } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ConsentCheckbox } from '@/components/ConsentCheckbox'
import { TrustPoints } from '@/components/TrustPoints'
import {
  authErrorMessage,
  OTP_IS_SIMULATED,
  startPhoneSignIn,
  toE164,
  toNationalDigits,
  useAuth,
} from '@/lib/auth'
import { safeNext, setPendingSignIn } from '@/lib/pendingSignIn'

/**
 * Sign in with a phone number.
 *
 * Nothing is asked for that the booking does not need. There is no password,
 * no email, no account to create first — the number is how a technician
 * reaches the door, so it is also the account.
 *
 * Consent is a hard gate rather than a pre-ticked box. The version agreed to is
 * stamped on the user record by the auth trigger, so a later change to the
 * terms shows up as a different version rather than being quietly applied to
 * someone who agreed to something else.
 */
export function LoginScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const { user, ready } = useAuth()

  const [phone, setPhone] = useState('')
  const [consented, setConsented] = useState(false)
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined)
  const [consentError, setConsentError] = useState<string | undefined>(undefined)
  const [sending, setSending] = useState(false)

  // Already signed in — usually a back-button press from further along.
  useEffect(() => {
    if (ready && user) router.replace(next)
  }, [ready, user, next, router])

  async function sendCode(event: React.FormEvent): Promise<void> {
    event.preventDefault()

    const e164 = toE164(phone)
    const valid = phoneSchema.safeParse(e164)
    setPhoneError(
      valid.success ? undefined : 'Enter a valid 10-digit Indian mobile number'
    )
    setConsentError(consented ? undefined : 'Please accept to continue')
    if (!valid.success || !consented) return

    setSending(true)
    try {
      const verification = await startPhoneSignIn(e164)
      setPendingSignIn({ phoneE164: e164, verification })
      router.push(
        `/login/otp?next=${encodeURIComponent(next)}` as Route
      )
    } catch (error) {
      setPhoneError(authErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthShell
      title="Your mobile number"
      subtitle="We send a one-time code to confirm it. The same number is how your expert reaches you on the day."
    >
      <form onSubmit={sendCode} className="flex flex-col gap-5">
          <Input
            label="Mobile number"
            value={phone}
            onChange={(event) => {
              // Peels a pasted country code or a typed trunk zero — see
              // toNationalDigits. Keeping the first ten of the raw digits is
              // what used to send the code to a different number entirely.
              setPhone(toNationalDigits(event.target.value))
              setPhoneError(undefined)
            }}
            // Checked on the way out of the field as well as on submit: a
            // number one digit short is worth saying so about before the
            // customer has pressed anything.
            onBlur={() => {
              if (phone.length === 0) return
              setPhoneError(
                phoneSchema.safeParse(toE164(phone)).success
                  ? undefined
                  : 'Enter a valid 10-digit Indian mobile number'
              )
            }}
            error={phoneError}
            inputMode="tel"
            autoComplete="tel-national"
            enterKeyHint="send"
            autoFocus
            placeholder="98765 43210"
            hint="+91 only. We do not service outside India."
          />

          <ConsentCheckbox
            checked={consented}
            onChange={(checked) => {
              setConsented(checked)
              if (checked) setConsentError(undefined)
            }}
            error={consentError}
          />

          <Button type="submit" fullWidth size="lg" loading={sending}>
            Send code
          </Button>
      </form>

      {OTP_IS_SIMULATED ? (
        <DevNote className="mt-4">
          No SMS is sent against the emulator. The code is printed in the
          emulator log, and the Auth tab at localhost:4000 shows it too.
        </DevNote>
      ) : null}

      <section className="mt-9 border-t border-border pt-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
          What you get
        </h2>
        <TrustPoints className="mt-3" compact />
      </section>
    </AuthShell>
  )
}
