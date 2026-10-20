import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams, type Href } from 'expo-router'

import { AuthShell } from '@/components/AuthShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { AuthError, emailProblem, signInWithEmail, signInWithGoogle } from '@/lib/data/auth'
import { safeNext } from '@/lib/pendingSignIn'
import { continueAfterSignIn, GoogleButton, OrDivider, PasswordInput, TermsNote } from './parts'

/**
 * Log in: Google first, then email and password. No phone number, no code.
 *
 * Google sits on top because it is one tap and needs nothing typed. The email
 * form is for everyone who would rather not. Forgot password and Create an
 * account are on this screen, not behind it, so nobody has to guess which way
 * in they need.
 *
 * Errors land on the field they are about: a wrong password under the
 * password, an unknown email under the email.
 */
export function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)
  const { user, ready } = useAuth()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)

  // Signed in, by either button or before they arrived: on to the next step.
  // The buttons only sign in; this is the one place that moves on, so a
  // sign-in is never followed by two navigations.
  useEffect(() => {
    if (ready && user && busy === null) continueAfterSignIn(user, next)
  }, [ready, user, busy, next])

  async function google(): Promise<void> {
    setBusy('google')
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Google sign-in did not work. Please try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function logIn(): Promise<void> {
    const emailIssue = emailProblem(email)
    setEmailError(emailIssue)
    setPasswordError(password ? undefined : 'Enter your password')
    if (emailIssue || !password) return

    setBusy('email')
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      if (error instanceof AuthError && error.code === 'wrong-password') setPasswordError(error.message)
      else if (error instanceof AuthError) setEmailError(error.message)
      else toast.show('We could not log you in. Check your connection and try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthShell
      title="Log in or sign up"
      subtitle="Trusted professionals for your home, booked in a minute."
      showBack={router.canGoBack()}
    >
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
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void logIn()}
        />
      </View>

      <Tappable
        href={`/forgot-password?email=${encodeURIComponent(email.trim())}` as Href}
        className="mt-1 min-h-11 justify-center self-end"
      >
        <Text className="text-sm font-semibold text-brand">Forgot password?</Text>
      </Tappable>

      <Button fullWidth size="lg" className="mt-3" onPress={() => void logIn()} loading={busy === 'email'}>
        Log in
      </Button>

      <View className="mt-5 flex-row flex-wrap items-center justify-center">
        <Text className="text-sm text-muted">New here? </Text>
        <Tappable
          href={`/signup?next=${encodeURIComponent(String(next))}` as Href}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-semibold text-brand">Create an account</Text>
        </Tappable>
      </View>

      <TermsNote />
    </AuthShell>
  )
}
