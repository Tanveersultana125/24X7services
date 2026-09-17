'use client'

import { useCallback, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { COL, updateProfileInputSchema, userProfileSchema } from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { saveName } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Name and email.
 *
 * That is the whole of what a customer may change about themselves here. The
 * phone number is the account and is shown as a fact; the consent record is
 * evidence of what was agreed and when, and neither belongs behind an edit
 * button.
 */
export function PersonalScreen() {
  return (
    <ProfileShell title="Personal details">
      {(user) => <PersonalForm uid={user.uid} phone={user.phoneNumber} />}
    </ProfileShell>
  )
}

function PersonalForm({
  uid,
  phone,
}: {
  uid: string
  phone: string | null
}) {
  const toast = useToast()
  const [name, setName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db(), COL.users, uid))
    const parsed = userProfileSchema.safeParse(snap.data())
    return parsed.success ? parsed.data : null
  }, [uid])

  const profile = useAsync(load)

  // The form starts from what was loaded and switches to what is being typed;
  // seeding state from an effect would fight the load.
  const nameValue = name ?? profile.data?.name ?? ''
  const emailValue = email ?? profile.data?.email ?? ''

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()

    const parsed = updateProfileInputSchema.safeParse({
      name: nameValue,
      email: emailValue.trim().length > 0 ? emailValue.trim() : undefined,
    })
    if (!parsed.success) {
      const next: { name?: string; email?: string } = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'name') next.name = issue.message
        if (field === 'email') next.email = issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      await saveName(uid, parsed.data.name, parsed.data.email)
      toast.show('Saved.', { tone: 'success' })
    } catch {
      toast.show('We could not save that. Please try again.', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (profile.status === 'loading') {
    return (
      <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </SkeletonGroup>
    )
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
      <Input
        label="Full name"
        required
        value={nameValue}
        onChange={(event) => {
          setName(event.target.value)
          setErrors((current) => ({ ...current, name: undefined }))
        }}
        error={errors.name}
        autoComplete="name"
      />

      <Input
        label="Email (optional)"
        type="email"
        value={emailValue}
        onChange={(event) => {
          setEmail(event.target.value)
          setErrors((current) => ({ ...current, email: undefined }))
        }}
        error={errors.email}
        autoComplete="email"
        hint="Only used if you ask us to email an invoice."
      />

      <Card className="p-4">
        <p className="text-xs text-muted">Mobile number</p>
        <p className="mt-0.5 text-sm font-medium text-ink">
          {phone ? formatPhone(phone) : 'Not set'}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          This is your account and how your expert reaches you. To change it,
          talk to support — moving an account to a new number is something we
          check by hand.
        </p>
      </Card>

      <Button type="submit" fullWidth loading={saving}>
        Save changes
      </Button>
    </form>
  )
}
