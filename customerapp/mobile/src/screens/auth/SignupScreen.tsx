import { useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, type Href } from 'expo-router'

import { AuthShell } from '@/components/AuthShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import {
  AuthError,
  emailProblem,
  MIN_PASSWORD,
  passwordProblem,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/data/auth'
import { safeNext } from '@/lib/pendingSignIn'
import { continueAfterSignIn, GoogleButton, OrDivider, PasswordInput, TermsNote } from './parts'

/**
 * Create an account: Google, or an email and a password. The name is asked on
 * the next step, the same step a Google sign-in skips because Google already
 * gave us one.
 *
 * The password rule is shown before anyone breaks it, as the field's hint,
 * rather than only as an error after they have.
 */
export function SignupScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)

  async function google(): Promise<void> {
    setBusy('google')
    try {
      continueAfterSignIn(await signInWithGoogle(), next)
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Google sign-in did not work. Please try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function create(): Promise<void> {
    const emailIssue = emailProblem(email)
    const passwordIssue = passwordProblem(password)
    setEmailError(emailIssue)
    setPasswordError(passwordIssue)
    if (emailIssue || passwordIssue) return

    setBusy('email')
    try {
      continueAfterSignIn(await signUpWithEmail(email, password), next)
    } catch (error) {
      if (error instanceof AuthError && error.code === 'weak-password') setPasswordError(error.message)
      else if (error instanceof AuthError) setEmailError(error.message)
      else toast.show('We could not create your account. Check your connection and try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes a few seconds." backFallback="/login">
      <GoogleButton onPress={() => void google()} loading={busy === 'google'} />
      <OrDivider />

      <View className="gap-4">
        <Input
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value)
            setEmailError(undefined)
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          placeholder="you@example.com"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value)
            setPasswordError(undefined)
          }}
          error={passwordError}
          hint={`At least ${MIN_PASSWORD} characters, with a number.`}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void create()}
        />
      </View>

      <Button fullWidth size="lg" className="mt-6" onPress={() => void create()} loading={busy === 'email'}>
        Create account
      </Button>

      <View className="mt-5 flex-row flex-wrap items-center justify-center">
        <Text className="text-sm text-muted">Already have an account? </Text>
        <Tappable
          href={`/login?next=${encodeURIComponent(String(next))}` as Href}
          replace
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-semibold text-brand">Log in</Text>
        </Tappable>
      </View>

      <TermsNote />
    </AuthShell>
  )
}
