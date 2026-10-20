import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { router } from 'expo-router'
import { Mail, UserRound } from 'lucide-react-native'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import type { AuthUser } from '@/lib/authStore'
import { updateProfile, useContactPhone } from '@/lib/data/profile'

/**
 * What a customer can change about themselves: the name the professional
 * greets them by, and a number to be called on. The email is the login, so it
 * is shown as a fact rather than offered as a field.
 *
 * The number is optional and nothing signs in with it. It is asked for in the
 * words that explain why anyone would give it.
 */
export function EditProfileScreen() {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bg">
      <ProfileShell
        title="Edit profile"
        signedOut={
          <SignInPrompt
            icon={UserRound}
            title="Your details"
            description="The name your professional greets you by and the one on your invoices. Log in to set it."
          />
        }
      >
        {(user) => <ProfileForm user={user} />}
      </ProfileShell>
    </KeyboardAvoidingView>
  )
}

/** An Indian mobile: ten digits, starting 6 to 9. */
const MOBILE = /^[6-9]\d{9}$/

type Errors = { name?: string; phone?: string }

function ProfileForm({ user }: { user: AuthUser }) {
  const toast = useToast()
  const contact = useContactPhone()
  const [name, setName] = useState(user.displayName ?? '')
  // Null until typed in, so the saved number shows once it has loaded; seeding
  // state from an effect would fight the load.
  const [phone, setPhone] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const phoneValue = phone ?? contact.data ?? ''

  async function save(): Promise<void> {
    const next: Errors = {}
    if (name.trim().length < 2) next.name = 'Enter your name, at least 2 letters'
    if (phoneValue && !MOBILE.test(phoneValue)) next.phone = 'Enter a 10-digit mobile number'
    if (next.name || next.phone) {
      setErrors(next)
      return
    }
    setSaving(true)
    try {
      await updateProfile(user, { name: name.trim(), phone: phoneValue })
      toast.show('Profile updated.', { tone: 'success' })
      router.back()
    } catch {
      toast.show('We could not save that. Please try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (contact.status === 'loading') {
    return (
      <SkeletonGroup label="Loading your details" className="mt-6 gap-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-16" />
        <Skeleton className="h-20" />
        <Skeleton className="h-12 rounded-pill" />
      </SkeletonGroup>
    )
  }

  if (contact.status === 'error') {
    return <ErrorState onRetry={contact.reload} retrying={contact.refreshing} />
  }

  return (
    <View className="mt-5 gap-5">
      <Input
        label="Full name"
        required
        value={name}
        onChangeText={(value) => {
          setName(value)
          setErrors((current) => ({ ...current, name: undefined }))
        }}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        placeholder="Your name"
        maxLength={60}
      />

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink">Email</Text>
        <View className="min-h-12 flex-row items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
          <Icon as={Mail} className="size-4 text-muted" />
          <Text numberOfLines={1} className="flex-1 text-base text-muted">
            {user.email ?? 'Not set'}
          </Text>
        </View>
        <Text className="text-xs text-muted">Your email is how you log in, so it cannot be changed here.</Text>
      </View>

      <Input
        label="Mobile number"
        value={phoneValue}
        onChangeText={(value) => {
          setPhone(value.replace(/\D/g, '').slice(0, 10))
          setErrors((current) => ({ ...current, phone: undefined }))
        }}
        error={errors.phone}
        hint="So your professional can call you"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        placeholder="10-digit number"
        prefix={<Text className="pl-4 text-base text-muted">+91</Text>}
      />

      <Button fullWidth size="lg" loading={saving} onPress={() => void save()}>
        Save changes
      </Button>
    </View>
  )
}
