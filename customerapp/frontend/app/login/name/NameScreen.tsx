'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
export function NameScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const { user, ready } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saving, setSaving] = useState(false)

  // Reaching this screen without an account means the sign-in did not finish.
  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user, router])

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!user) return

    const parsed = updateProfileInputSchema.safeParse({
      name,
      email: email.trim().length > 0 ? email.trim() : undefined,
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

    setSaving(true)
    try {
      await saveName(user.uid, parsed.data.name, parsed.data.email)
      router.replace(next)
    } catch {
      toast.show('We could not save that just now. Please try again.', {
        tone: 'error',
      })
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
      <form onSubmit={submit} className="flex flex-col gap-5">
          <Input
            label="Full name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setErrors((current) => ({ ...current, name: undefined }))
            }}
            error={errors.name}
            autoComplete="name"
            autoFocus
            enterKeyHint="done"
            placeholder="Your name"
          />

          <Input
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors((current) => ({ ...current, email: undefined }))
            }}
            error={errors.email}
            autoComplete="email"
            hint="Only used if you ask us to email an invoice."
            placeholder="you@example.com"
          />

        <Button type="submit" fullWidth size="lg" loading={saving}>
          Continue
        </Button>
      </form>
    </AuthShell>
  )
}
