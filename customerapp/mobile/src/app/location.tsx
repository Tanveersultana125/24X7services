import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Check, MapPin, MapPinOff } from 'lucide-react-native'
import { pincodeSchema, type ServiceArea } from '@app/shared'

import { Header, Screen } from '@/components/Screen'
import { useLocation } from '@/lib/useLocation'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
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
 * compiled into the bundle, where it gets lifted and billed to us. DECISION
 * NEEDED: if detection is wanted, it belongs behind a callable that keeps the
 * key server-side, which is an addition to the shared registry rather than a
 * screen-level change.
 */

type Outcome =
  | { kind: 'serviceable'; pincode: string; city: string; area: string }
  | { kind: 'unserviceable'; pincode: string; area?: string | undefined; city?: string | undefined }

export default function LocationScreen() {
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
    [setLocation]
  )

  async function check(): Promise<void> {
    const parsed = pincodeSchema.safeParse(pincode.trim())
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid pincode')
      return
    }

    setFieldError(undefined)
    setOutcome(null)
    setChecking(true)
    try {
      const result = await callFn('checkServiceability', { pincode: parsed.data })
      setOutcome(
        result.serviceable && result.city && result.area
          ? { kind: 'serviceable', pincode: parsed.data, city: result.city, area: result.area }
          : { kind: 'unserviceable', pincode: parsed.data, city: result.city, area: result.area }
      )
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setChecking(false)
    }
  }

  const byCity = useMemo(() => groupByCity(areas.data ?? []), [areas.data])

  return (
    <Screen
      // Back only when there is somewhere to go back to. Arriving from the
      // splash means the app replaced its own entry in the history.
      header={<Header title="Your location" showBack={location !== null} />}
      contentClassName="px-4 pb-16"
    >
      <Text className="mt-4 text-sm text-muted">
        We service parts of Hyderabad. Enter a pincode to check yours, or pick an area from the list.
      </Text>

      <View className="mt-5 flex-row items-end gap-2">
        <View className="flex-1">
          <Input
            label="Pincode"
            value={pincode}
            onChangeText={(value) => {
              // Digits only, and never more than a pincode has.
              setPincode(value.replace(/\D/g, '').slice(0, 6))
              setFieldError(undefined)
              setOutcome(null)
            }}
            error={fieldError}
            keyboardType="number-pad"
            autoComplete="postal-code"
            returnKeyType="search"
            onSubmitEditing={() => void check()}
            placeholder="500084"
          />
        </View>
        <Button
          onPress={() => void check()}
          loading={checking}
          // Stays level with the input rather than with the label above it,
          // and rises with it when an error line appears under the field.
          className={cn('shrink-0', fieldError && 'mb-7')}
        >
          Check
        </Button>
      </View>

      {outcome ? <OutcomePanel outcome={outcome} onContinue={choose} /> : null}

      <View className="mt-8">
        <Text accessibilityRole="header" className="mb-3 text-xl font-bold text-ink">
          Areas we service
        </Text>

        {areas.status === 'loading' ? (
          <SkeletonGroup label="Loading areas" className="gap-2">
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
          <Card className="p-4">
            <Text className="text-sm text-muted">No areas are switched on right now. Please check back soon.</Text>
          </Card>
        ) : (
          byCity.map(([city, cityAreas], cityIndex) => (
            <View key={city} className={cityIndex === byCity.length - 1 ? '' : 'mb-6'}>
              <Text accessibilityRole="header" className="mb-2 text-sm font-semibold text-muted">
                {city}
              </Text>
              <Card className="overflow-hidden">
                {cityAreas.map((area, index) => (
                  <Tappable
                    key={area.pincode}
                    onPress={() => choose({ pincode: area.pincode, city: area.city, area: area.area })}
                    className={cn(
                      'w-full flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100',
                      index < cityAreas.length - 1 && 'border-b border-border'
                    )}
                  >
                    <Icon as={MapPin} className="size-4 text-muted" />
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-base font-medium text-ink">
                        {area.area}
                      </Text>
                      <Text className="text-xs text-muted">{area.pincode}</Text>
                    </View>
                  </Tappable>
                ))}
              </Card>
            </View>
          ))
        )}
      </View>
    </Screen>
  )
}

/** Cities in the order they first appear; the areas inside are already sorted. */
function groupByCity(areas: readonly ServiceArea[]): Array<[string, ServiceArea[]]> {
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
        <View className="flex-row items-start gap-3">
          <View className="size-10 items-center justify-center rounded-full bg-success-soft">
            <Icon as={Check} className="size-5 text-success" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-ink">Yes, we service {outcome.area}</Text>
            <Text className="mt-0.5 text-sm text-muted">
              {outcome.city} · {outcome.pincode}
            </Text>
          </View>
        </View>
        <Button
          fullWidth
          className="mt-4"
          onPress={() => onContinue({ pincode: outcome.pincode, city: outcome.city, area: outcome.area })}
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
function WaitlistPanel({ outcome }: { outcome: Extract<Outcome, { kind: 'unserviceable' }> }) {
  const toast = useToast()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [joined, setJoined] = useState(false)

  const place = outcome.area ? `${outcome.area}${outcome.city ? `, ${outcome.city}` : ''}` : outcome.pincode

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
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-warning-soft">
          <Icon as={MapPinOff} className="size-5 text-warning" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink">We are not in {place} yet</Text>
          <Text className="mt-0.5 text-sm text-muted">
            We are adding areas around Hyderabad. If you have another address there, pick it from the list below.
          </Text>
        </View>
      </View>

      {joined ? (
        <View className="mt-4 flex-row items-center gap-2 rounded-card bg-surface px-4 py-3">
          <Icon as={Check} className="size-4 text-success" />
          <Text className="flex-1 text-sm text-ink">Noted. We will tell you when we reach {outcome.pincode}.</Text>
        </View>
      ) : (
        <View className="mt-4 gap-3">
          <Input
            label="Mobile number (optional)"
            hint="Used only to tell you when we start servicing this pincode."
            value={phone}
            onChangeText={(value) => {
              setPhone(value.replace(/\D/g, '').slice(0, 10))
              setError(undefined)
            }}
            error={error}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="98765 43210"
          />
          <Button variant="secondary" fullWidth loading={saving} onPress={() => void join()}>
            Tell me when you reach here
          </Button>
        </View>
      )}
    </Card>
  )
}
