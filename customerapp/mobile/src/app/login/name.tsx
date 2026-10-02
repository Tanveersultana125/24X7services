import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { updateProfileInputSchema } from '@app/shared'

import { AuthShell } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth, saveName } from '@/lib/auth'
import { safeNext } from '@/lib/pendingSignIn'
import { useToast } from '@/components/Toast'

/**
 * The name, asked once, right after the first sign-in.
 *
 * It is on the invoice and it is what the technician asks for at the door, so
 * it is not optional. The email is, and says so — nothing in the app needs one,
 * and a field that looks required but is not teaches people to type anything.
 */
export default function NameScreen() {
  const params = useLocalSearchParams<{ next?: string }>()
  const next = safeNext(typeof params.next === 'string' ? params.next : null)
  const { user, ready } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string | undefined; email?: string | undefined }>({})
  const [saving, setSaving] = useState(false)

  // Reaching this screen without an account means the sign-in did not finish.
  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user])

  async function submit(): Promise<void> {
    if (!user) return

    const parsed = updateProfileInputSchema.safeParse({
      name,
      email: email.trim().length > 0 ? email.trim() : undefined,
    })
    if (!parsed.success) {
      const found: { name?: string; email?: string } = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'name') found.name = issue.message
        if (field === 'email') found.email = issue.message
      }
      setErrors(found)
      return
    }

    setSaving(true)
    try {
      await saveName(user.uid, parsed.data.name, parsed.data.email)
      router.replace(next)
    } catch {
      toast.show('We could not save that just now. Please try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell
      title="What should we call you?"
      subtitle="Your expert asks for this name at the door, and it appears on your invoice."
      showBack={false}
    >
      <View className="gap-5">
        <Input
          label="Full name"
          required
          value={name}
          onChangeText={(value) => {
            setName(value)
            setErrors((current) => ({ ...current, name: undefined }))
          }}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          autoFocus
          returnKeyType="done"
          placeholder="Your name"
        />

        <Input
          label="Email (optional)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: undefined }))
          }}
          error={errors.email}
          autoComplete="email"
          textContentType="emailAddress"
          hint="Only used if you ask us to email an invoice."
          placeholder="you@example.com"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />

        <Button fullWidth size="lg" loading={saving} onPress={() => void submit()}>
          Continue
        </Button>
      </View>
    </AuthShell>
  )
}
