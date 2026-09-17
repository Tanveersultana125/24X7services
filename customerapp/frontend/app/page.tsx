import { brand } from '@/config/brand'

/**
 * Splash. Phase 2 replaces this with the redirect into /location — there is no
 * onboarding carousel, so this screen exists only to cover the moment before
 * the app knows where the customer is.
 */
export default function SplashPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-3xl font-extrabold tracking-tight">{brand.wordmark}</p>
      <p className="text-sm text-muted">{brand.tagline}</p>
    </main>
  )
}
