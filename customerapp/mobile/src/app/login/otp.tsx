import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import { COL } from '@app/shared'

import { AuthShell, DevNote } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { OtpInput } from '@/components/OtpInput'
import { authErrorMessage, OTP_IS_SIMULATED, startPhoneSignIn } from '@/lib/auth'
import { auth, db } from '@/lib/firebase'
import { formatPhone } from '@/lib/format'
import { clearPendingSignIn, safeNext, setPendingSignIn, takePendingSignIn } from '@/lib/pendingSignIn'

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
export default function OtpScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)

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
          (await hasName()) ? next : (`/login/name?next=${encodeURIComponent(String(next))}` as Href)
        )
      } catch (caught) {
        setError(authErrorMessage(caught))
        setCode('')
        submitted.current = false
      } finally {
        setChecking(false)
      }
    },
    [pending, next]
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
      <AuthShell
        title="This sign-in has expired"
        subtitle="Codes are only good for a few minutes. Please enter your number again."
        backFallback="/login"
      >
        <Button fullWidth size="lg" onPress={() => router.replace('/login')}>
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Enter the code"
      backFallback="/login"
      subtitle={
        <>
          We sent a 6-digit code to{' '}
          <Text className="text-sm font-semibold text-white">{formatPhone(pending.phoneE164)}</Text>.
        </>
      }
    >
      <OtpInput
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
        onPress={() => void verify(code)}
      >
        Verify and continue
      </Button>

      <View className="mt-4 items-center">
        {secondsLeft > 0 ? (
          <Text className="text-center text-sm text-muted">Resend in {secondsLeft}s</Text>
        ) : (
          <Tappable onPress={() => void resend()} disabled={resending} className="min-h-11 justify-center px-2">
            <Text className={resending ? 'text-sm font-semibold text-muted' : 'text-sm font-semibold text-brand underline'}>
              {resending ? 'Sending…' : 'Resend code'}
            </Text>
          </Tappable>
        )}
      </View>

      {OTP_IS_SIMULATED ? (
        <DevNote className="mt-6">
          The emulator prints the code rather than sending it. Look in the terminal running the emulators, or the
          Auth tab at localhost:4000.
        </DevNote>
      ) : null}
    </AuthShell>
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
