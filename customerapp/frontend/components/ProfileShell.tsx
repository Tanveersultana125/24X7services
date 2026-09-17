'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import type { User } from 'firebase/auth'

import { Header } from '@/components/Header'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'

/**
 * The frame every screen under the profile shares: a title, a way back, and the
 * same sign-in gate.
 *
 * `next` is built from the current URL rather than passed in, so a customer
 * sent to sign in from deep inside the profile comes back to the screen they
 * were on and not to its parent.
 */
export function ProfileShell({
  title,
  subtitle,
  backFallback = '/profile',
  children,
}: {
  title: string
  subtitle?: string
  backFallback?: Route
  children: (user: User) => React.ReactNode
}) {
  const router = useRouter()
  const { user, ready } = useAuth()

  useEffect(() => {
    if (ready && !user) {
      router.replace(
        `/login?next=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        )}` as Route
      )
    }
  }, [ready, user, router])

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={title}
        subtitle={subtitle}
        showBack
        backFallback={backFallback}
      />
      <main className="mx-auto w-full max-w-lg px-4 pb-16 lg:max-w-2xl">
        {!ready || !user ? (
          <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </SkeletonGroup>
        ) : (
          children(user)
        )}
      </main>
    </div>
  )
}
