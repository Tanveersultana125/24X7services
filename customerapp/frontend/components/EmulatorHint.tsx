'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { EMULATOR_HOST, usingEmulators } from '@/lib/firebase'
import { cn } from '@/lib/cn'

/**
 * Why the screen behind this probably failed, when the answer is "an emulator
 * is not running".
 *
 * It exists because that failure is invisible from the app. A callable whose
 * emulator is down returns the same error as a callable that threw, so the
 * screen says "Something went wrong" and a developer spends twenty minutes
 * reading their own handler before thinking to check which emulators actually
 * came up. This asks the hub, which knows, and names the missing one.
 *
 * Development only, twice over: it renders nothing unless the app was built
 * against the emulators, and the host it asks is a loopback address. Nothing
 * here can appear in front of a customer.
 */

/** The hub's own port. Not configurable in backend/firebase.json, so not here. */
const HUB_PORT = 4400

/**
 * The emulators this app talks to, and the port each one answers on. Kept in
 * step with the `connectXEmulator` calls in lib/firebase.ts — the hub reports
 * everything it started, including ones the app never uses, and naming those
 * as missing would send someone chasing an emulator nothing needs.
 */
const NEEDED = ['auth', 'firestore', 'functions', 'storage'] as const

type State =
  | { kind: 'checking' }
  /** Nothing to say: everything the app needs is up, or we could not tell. */
  | { kind: 'quiet' }
  | { kind: 'missing'; names: string[] }
  /** The hub did not answer, so nothing is running. */
  | { kind: 'down' }

export function EmulatorHint({ className }: { className?: string }) {
  const [state, setState] = useState<State>({ kind: 'checking' })

  useEffect(() => {
    if (!usingEmulators) return
    let live = true

    // A short deadline: this is a hint, and a hint that holds an error screen
    // hostage while it waits on a port that is not listening is worse than no
    // hint at all.
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), 1500)

    fetch(`http://${EMULATOR_HOST}:${HUB_PORT}/emulators`, {
      signal: abort.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!live) return
        if (body === null || typeof body !== 'object') {
          setState({ kind: 'quiet' })
          return
        }
        const running = new Set(Object.keys(body))
        const names = NEEDED.filter((name) => !running.has(name))
        setState(names.length > 0 ? { kind: 'missing', names } : { kind: 'quiet' })
      })
      .catch(() => {
        if (live) setState({ kind: 'down' })
      })
      .finally(() => clearTimeout(timer))

    return () => {
      live = false
      abort.abort()
    }
  }, [])

  if (!usingEmulators) return null
  if (state.kind === 'checking' || state.kind === 'quiet') return null

  return (
    <div
      className={cn(
        'mx-auto flex max-w-sm items-start gap-2 rounded-card border border-warning bg-warning-soft p-3 text-left',
        className
      )}
    >
      <TriangleAlert
        className="mt-0.5 size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed text-ink">
        <span className="font-bold">DEV</span>{' '}
        {state.kind === 'down'
          ? 'No emulators are running, so nothing the app asks for can be answered.'
          : `Not running: ${state.names.join(', ')}. Anything that needs ${
              state.names.length > 1 ? 'them' : 'it'
            } will fail like this.`}{' '}
        Start them with <code className="font-semibold">npm run emulators</code>{' '}
        from <code className="font-semibold">customerapp</code>.
      </p>
    </div>
  )
}
