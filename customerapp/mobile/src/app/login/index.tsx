import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams, type Href } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import { phoneSchema } from '@app/shared'

import { AuthShell, DevNote } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
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
import { DemoNotice, isDemoOff } from '@/screens/book/DemoNotice'

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
export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)
  const { user, ready } = useAuth()

  const [phone, setPhone] = useState('')
  const [consented, setConsented] = useState(false)
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined)
  const [consentError, setConsentError] = useState<string | undefined>(undefined)
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Already signed in — usually a back-button press from further along.
  useEffect(() => {
    if (ready && user) router.replace(next)
  }, [ready, user, next])

  async function sendCode(): Promise<void> {
    const e164 = toE164(phone)
    const valid = phoneSchema.safeParse(e164)
    setPhoneError(valid.success ? undefined : 'Enter a valid 10-digit Indian mobile number')
    setConsentError(consented ? undefined : 'Please accept to continue')
    setNotice(null)
    if (!valid.success || !consented) return

    setSending(true)
    try {
      const verification = await startPhoneSignIn(e164)
      setPendingSignIn({ phoneE164: e164, verification })
      router.push(`/login/otp?next=${encodeURIComponent(String(next))}` as Href)
    } catch (error) {
      // The demo build refusing is not the number being wrong.
      if (isDemoOff(error)) setNotice(authErrorMessage(error))
      else setPhoneError(authErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthShell
      title="Your mobile number"
      subtitle="We send a one-time code to confirm it. The same number is how your expert reaches you on the day."
    >
      <View className="gap-5">
        <Input
          label="Mobile number"
          value={phone}
          onChangeText={(value) => {
            // Peels a pasted country code or a typed trunk zero — see
            // toNationalDigits. Keeping the first ten of the raw digits is
            // what used to send the code to a different number entirely.
            setPhone(toNationalDigits(value))
            setPhoneError(undefined)
            setNotice(null)
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
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="send"
          onSubmitEditing={() => void sendCode()}
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

        {notice ? <DemoNotice message={notice} /> : null}

        <Button fullWidth size="lg" loading={sending} onPress={() => void sendCode()}>
          Send code
        </Button>
      </View>

      {OTP_IS_SIMULATED ? (
        <DevNote className="mt-4">
          No SMS is sent against the emulator. The code is printed in the emulator log, and the Auth tab at
          localhost:4000 shows it too.
        </DevNote>
      ) : null}

      <View className="mt-9 border-t border-border pt-5">
        <View className="flex-row items-center gap-2">
          <Icon as={ShieldCheck} className="size-4 text-brand" />
          <Text accessibilityRole="header" className="text-sm font-semibold text-ink">
            What you get
          </Text>
        </View>
        <TrustPoints className="mt-3" compact />
      </View>
    </AuthShell>
  )
}
