import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { AuthShell } from '@/components/AuthShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { saveProfileName } from '@/lib/data/auth'
import { safeNext } from '@/lib/pendingSignIn'
import { continueAfterSignIn } from './parts'

/**
 * The one question after a first email sign-up: what to call them. It is the
 * name the professional greets them by and the name on the invoice, so it is
 * asked for in those words. A Google sign-in arrives with a name and skips it.
 *
 * The email is shown, not asked, so the customer can see which account they
 * have just made.
 */
export function ProfileSetupScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)
  const { user, ready } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(user?.displayName ?? '')
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  // Nobody signed in has no name to give.
  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user])

  async function save(): Promise<void> {
    if (!user) return
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Enter your name')
      return
    }
    setSaving(true)
    try {
      continueAfterSignIn(await saveProfileName(user, trimmed), next)
    } catch {
      toast.show('We could not save your name. Check your connection and try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell
      title="What should we call you?"
      subtitle="Your professional greets you by this name, and it goes on your invoices."
      showBack={false}
    >
      <Input
        label="Your name"
        value={name}
        onChangeText={(value) => {
          setName(value)
          setError(undefined)
        }}
        error={error}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        placeholder="Full name"
        maxLength={60}
      />

      {user?.email ? (
        <View className="mt-4 rounded-card bg-surface px-4 py-3">
          <Text className="text-xs text-muted">Signed in as</Text>
          <Text numberOfLines={1} className="text-sm font-medium text-ink">
            {user.email}
          </Text>
        </View>
      ) : null}

      <Button fullWidth size="lg" className="mt-6" onPress={() => void save()} loading={saving}>
        Continue
      </Button>
    </AuthShell>
  )
}
