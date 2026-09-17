'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, MapPin, MapPinOff } from 'lucide-react'
import { pincodeSchema, type ServiceArea } from '@app/shared'

import { Header } from '@/components/Header'
import { useLocation } from '@/lib/useLocation'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { fetchServiceAreas } from '@/lib/catalog'
import { callFn, friendlyError } from '@/lib/callables'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * Where the work will happen, and whether we can do it there.
 *
 * Two ways in, because customers arrive knowing different things. Someone who
 * knows their pincode types it; someone who knows the name of their area picks
 * it off the list of places we actually cover. Both end at the same saved
 * location, and both give an answer before anyone is asked for a phone number.
 *
 * There is no "detect my location" button. Turning a coordinate into a pincode
 * needs a geocoding call, and the only key the app could carry for that is one
 * compiled into the bundle — a web-service key cannot be restricted by referrer,
 * so it gets lifted and billed to us. DECISION NEEDED: if detection is wanted,
 * it belongs behind a callable that keeps the key server-side, which is an
 * addition to the shared registry rather than a screen-level change.
 */

type Outcome =
  | { kind: 'serviceable'; pincode: string; city: string; area: string }
  | { kind: 'unserviceable'; pincode: string; area?: string; city?: string }

export function LocationScreen() {
  const router = useRouter()
  const { location, setLocation } = useLocation()
  const toast = useToast()

  const [pincode, setPincode] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)
  const [checking, setChecking] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const loadAreas = useCallback(() => fetchServiceAreas(), [])
  const areas = useAsync(loadAreas)

  /** Saving is the same step whichever way the pincode was arrived at. */
  const choose = useCallback(
    (chosen: { pincode: string; city: string; area: string }) => {
      setLocation({ ...chosen, serviceable: true, checkedAt: Date.now() })
      router.replace('/home')
    },
    [router, setLocation]
  )

  async function check(event: React.FormEvent): Promise<void> {
    event.preventDefault()

    const parsed = pincodeSchema.safeParse(pincode.trim())
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid pincode')
      return
    }

    setFieldError(undefined)
    setOutcome(null)
    setChecking(true)
    try {
      const result = await callFn('checkServiceability', {
        pincode: parsed.data,
      })
      setOutcome(
        result.serviceable && result.city && result.area
          ? {
              kind: 'serviceable',
              pincode: parsed.data,
              city: result.city,
              area: result.area,
            }
          : {
              kind: 'unserviceable',
              pincode: parsed.data,
              city: result.city,
              area: result.area,
            }
      )
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setChecking(false)
    }
  }

  const byCity = useMemo(() => groupByCity(areas.data ?? []), [areas.data])

  return (
    <div className="min-h-dvh bg-bg">
      {/* Back only when there is somewhere to go back to. Arriving from the
          splash means the app replaced its own entry in the history. */}
      <Header title="Your location" showBack={location !== null} />

      <main className="mx-auto w-full max-w-lg px-4 pb-16 lg:max-w-2xl">
        <p className="mt-4 text-sm text-muted">
          We service parts of Hyderabad. Enter a pincode to check yours, or pick
          an area from the list.
        </p>

        <form onSubmit={check} className="mt-5 flex items-end gap-2">
          <Input
            label="Pincode"
            className="flex-1"
            value={pincode}
            onChange={(event) => {
              // Digits only, and never more than a pincode has.
              setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))
              setFieldError(undefined)
              setOutcome(null)
            }}
            error={fieldError}
            inputMode="numeric"
            autoComplete="postal-code"
            enterKeyHint="search"
            placeholder="500084"
          />
          <Button
            type="submit"
            loading={checking}
            // Stays level with the input rather than with the label above it,
            // and drops further when an error line appears under the field.
            className={cn('shrink-0', fieldError && 'mb-7')}
          >
            Check
          </Button>
        </form>

        {outcome ? (
          <OutcomePanel outcome={outcome} onContinue={choose} />
        ) : null}

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-ink">Areas we service</h2>

          {areas.status === 'loading' ? (
            <SkeletonGroup label="Loading areas" className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </SkeletonGroup>
          ) : areas.status === 'error' ? (
            <ErrorState
              onRetry={areas.reload}
              retrying={areas.refreshing}
              description="We could not load the list of areas. You can still check a pincode above."
            />
          ) : byCity.length === 0 ? (
            <Card className="p-4 text-sm text-muted">
              No areas are switched on right now. Please check back soon.
            </Card>
          ) : (
            byCity.map(([city, cityAreas]) => (
              <div key={city} className="mb-6 last:mb-0">
                <h3 className="mb-2 text-sm font-semibold text-muted">{city}</h3>
                <Card className="overflow-hidden">
                  <ul>
                    {cityAreas.map((area) => (
                      <li
                        key={area.pincode}
                        className="border-b border-border last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            choose({
                              pincode: area.pincode,
                              city: area.city,
                              area: area.area,
                            })
                          }
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface"
                        >
                          <MapPin
                            className="size-4 shrink-0 text-muted"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-medium text-ink">
                              {area.area}
                            </span>
                            <span className="block text-xs text-muted">
                              {area.pincode}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}

/** Cities in the order they first appear; the areas inside are already sorted. */
function groupByCity(
  areas: readonly ServiceArea[]
): Array<[string, ServiceArea[]]> {
  const groups = new Map<string, ServiceArea[]>()
  for (const area of areas) {
    const existing = groups.get(area.city)
    if (existing) existing.push(area)
    else groups.set(area.city, [area])
  }
  return Array.from(groups.entries())
}

// ---------------------------------------------------------------------------

function OutcomePanel({
  outcome,
  onContinue,
}: {
  outcome: Outcome
  onContinue: (chosen: { pincode: string; city: string; area: string }) => void
}) {
  if (outcome.kind === 'serviceable') {
    return (
      <Card raised className="mt-5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft">
            <Check className="size-5 text-success" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink">
              Yes, we service {outcome.area}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {outcome.city} · {outcome.pincode}
            </p>
          </div>
        </div>
        <Button
          fullWidth
          className="mt-4"
          onClick={() =>
            onContinue({
              pincode: outcome.pincode,
              city: outcome.city,
              area: outcome.area,
            })
          }
        >
          Continue
        </Button>
      </Card>
    )
  }

  return <WaitlistPanel outcome={outcome} />
}

/**
 * Not here yet. The honest version of that is a waitlist rather than a dead
 * end, and the number is optional — someone who only wanted to know whether we
 * cover their area already has their answer.
 */
function WaitlistPanel({
  outcome,
}: {
  outcome: Extract<Outcome, { kind: 'unserviceable' }>
}) {
  const toast = useToast()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [joined, setJoined] = useState(false)

  const place = outcome.area
    ? `${outcome.area}${outcome.city ? `, ${outcome.city}` : ''}`
    : outcome.pincode

  async function join(): Promise<void> {
    const digits = phone.replace(/\D/g, '')
    if (digits.length > 0 && !/^[6-9][0-9]{9}$/.test(digits)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }

    setError(undefined)
    setSaving(true)
    try {
      await callFn('joinWaitlist', {
        pincode: outcome.pincode,
        ...(digits.length === 10 ? { phone: `+91${digits}` } : {}),
      })
      setJoined(true)
      toast.show('We will let you know when we reach you.', { tone: 'success' })
    } catch (caught) {
      toast.show(friendlyError(caught), { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card raised className="mt-5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft">
          <MapPinOff className="size-5 text-warning" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">
            We are not in {place} yet
          </p>
          <p className="mt-0.5 text-sm text-muted">
            We are adding areas around Hyderabad. If you have another address
            there, pick it from the list below.
          </p>
        </div>
      </div>

      {joined ? (
        <p className="mt-4 flex items-center gap-2 rounded-card bg-surface px-4 py-3 text-sm text-ink">
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
          Noted. We will tell you when we reach {outcome.pincode}.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Mobile number (optional)"
            hint="Used only to tell you when we start servicing this pincode."
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              setError(undefined)
            }}
            error={error}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="98765 43210"
          />
          <Button variant="secondary" fullWidth loading={saving} onClick={join}>
            Tell me when you reach here
          </Button>
        </div>
      )}
    </Card>
  )
}
