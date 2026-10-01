'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

/** The front door: the dashboard if signed in, otherwise sign-in. */
export default function Index() {
  const { ready, signedIn } = useStore()
  const router = useRouter()
  useEffect(() => {
    if (ready) router.replace(signedIn ? '/dashboard' : '/login')
  }, [ready, signedIn, router])
  return <div className="min-h-dvh bg-brand-ink" />
}
