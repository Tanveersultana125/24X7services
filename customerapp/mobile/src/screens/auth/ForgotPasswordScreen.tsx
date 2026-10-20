import { useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { MailCheck } from 'lucide-react-native'

import { AuthShell } from '@/components/AuthShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { emailProblem, sendPasswordReset } from '@/lib/data/auth'

/**
 * Forgot password: an email in, a reset link out.
 *
 * The answer is the same whether or not the email has an account. Saying "no
 * account with that email" would turn this screen into a way to find out who
 * is a customer, so it says where the link went if there was one to send.
 */
export function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const toast = useToast()

  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '')
  const [error, setError] = useState<string | undefined>()
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function send(): Promise<void> {
    const problem = emailProblem(email)
    setError(problem)
    if (problem) return

    setSending(true)
    try {
      await sendPasswordReset(email)
      setSentTo(email.trim())
    } catch {
      toast.show('We could not send the link. Check your connection and try again.', { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox" backFallback="/login">
        <View className="items-center rounded-card bg-surface px-5 py-8">
          <View className="size-14 items-center justify-center rounded-full bg-success-soft">
            <Icon as={MailCheck} className="size-7 text-success" />
          </View>
          <Text className="mt-4 text-center text-base text-ink">
            {`If there is an account for ${sentTo}, a link to set a new password is on its way.`}
          </Text>
          <Text className="mt-2 text-center text-sm text-muted">
            It can take a minute. Check the spam folder if it does not show up.
          </Text>
        </View>
        <Button fullWidth size="lg" className="mt-6" href="/login" replace>
          Back to log in
        </Button>
        <Button variant="ghost" fullWidth className="mt-2" onPress={() => setSentTo(null)}>
          Use a different email
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will send you a link."
      backFallback="/login"
    >
      <Input
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value)
          setError(undefined)
        }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void send()}
        placeholder="you@example.com"
      />
      <Button fullWidth size="lg" className="mt-6" onPress={() => void send()} loading={sending}>
        Send reset link
      </Button>
    </AuthShell>
  )
}
