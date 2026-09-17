'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '@/config/brand'
import { useLocation } from '@/lib/useLocation'

/**
 * Splash.
 *
 * There is no onboarding carousel. This screen exists to cover one moment: the
 * app cannot read the saved location during prerender, so between the first
 * paint and the first effect it genuinely does not know whether this is someone
 * returning or someone new. Rather than flash Home at a customer who has never
 * given us a pincode, it shows the wordmark for that instant and then goes
 * wherever the answer says.
 *
 * `replace` rather than `push`: pressing back from Home should leave the app,
 * not land on a splash that immediately bounces forward again.
 */
export default function SplashPage() {
  const router = useRouter()
  const { location, ready } = useLocation()

  useEffect(() => {
    if (!ready) return
    router.replace(location ? '/home' : '/location')
  }, [ready, location, router])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-3xl font-extrabold tracking-tight">{brand.wordmark}</p>
      <p className="text-sm text-muted">{brand.tagline}</p>
      {/* Announced once, for anyone who hears the screen rather than sees it. */}
      <span className="sr-only" role="status">
        Loading
      </span>
    </main>
  )
}
