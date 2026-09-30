'use client'

import {
  collection,
  disableNetwork,
  doc,
  getDoc,
  getDocs,
  loadBundle,
} from 'firebase/firestore'
import { FunctionsError } from 'firebase/functions'
import {
  COL,
  serviceAreaSchema,
  type CallableInput,
  type CallableName,
  type SearchHit,
} from '@app/shared'
import { db } from './firebase'
import { addDaysToKey, todayKey } from './format'

/**
 * The backend-free build.
 *
 * Firestore is taken offline and filled from `/demo-data.bundle` — the public
 * half of the seed catalog, written by `npm run demo:bundle`. An offline
 * Firestore answers every read from its cache, so the screens keep making the
 * calls they always make and get the seed data back.
 *
 * Nothing that writes is faked. Sign-in, booking and payment need the real
 * backend, and they say so instead of pretending to succeed.
 */

let ready: Promise<void> | undefined

/**
 * Loads the catalog into the cache, once per page load.
 *
 * The app is held back until this resolves (DemoGate): a one-shot read made
 * against an empty offline cache resolves straight away with nothing, and a
 * screen would render "no services" rather than wait.
 */
export function loadDemoData(): Promise<void> {
  ready ??= (async () => {
    const store = db()
    await disableNetwork(store)
    const response = await fetch('/demo-data.bundle')
    if (!response.ok) {
      throw new Error(`Demo data did not load (${response.status})`)
    }
    await loadBundle(store, await response.arrayBuffer())
  })()
  return ready
}

const OFF_IN_DEMO =
  'This is a demo, so signing in, booking and payments are switched off.'

/**
 * The few callables that only read public data, answered from the cache.
 * Everything else fails the way a real refusal would, with a message the
 * screens already know how to show.
 */
export async function demoCall<N extends CallableName>(
  name: N,
  input: CallableInput<N>
): Promise<unknown> {
  await loadDemoData()

  switch (name) {
    case 'checkServiceability': {
      const { pincode } = input as CallableInput<'checkServiceability'>
      const snap = await getDoc(doc(db(), COL.serviceAreas, pincode))
      const parsed = serviceAreaSchema.safeParse(snap.data())
      if (!parsed.success) return { serviceable: false }
      const { city, area, active } = parsed.data
      return { serviceable: active, city, area }
    }
    case 'searchCatalog': {
      const { q } = input as CallableInput<'searchCatalog'>
      return { hits: await search(q) }
    }
    case 'getAvailableSlots': {
      const { fromDate, days } = input as CallableInput<'getAvailableSlots'>
      return { days: demoSlots(fromDate, days) }
    }
    default:
      throw new FunctionsError('failed-precondition', OFF_IN_DEMO)
  }
}

/**
 * The visit windows the emulator is seeded with (`SLOT_WINDOWS` in
 * backend/seed/seed.ts), every one of them open, since nobody can book in a
 * demo. Slot documents are not in the bundle — there would be one per pincode
 * per day — so the demo answers from the same timetable instead. Today's
 * windows that have already started are shut, as they are on the server.
 */
const DEMO_WINDOWS = [
  ['09:00', '11:00'],
  ['11:00', '13:00'],
  ['13:00', '15:00'],
  ['15:00', '17:00'],
  ['17:00', '19:00'],
] as const

function demoSlots(fromDate: string, days: number) {
  const now = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  const today = todayKey()
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysToKey(fromDate, i)
    return {
      date,
      windows: DEMO_WINDOWS.map(([start, end]) => ({
        start,
        end,
        availability:
          date < today || (date === today && start <= now)
            ? ('unavailable' as const)
            : ('available' as const),
      })),
    }
  })
}

/** The same matching searchCatalog does on the server, over the cached index. */
async function search(q: string): Promise<SearchHit[]> {
  const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  if (terms.length === 0) return []

  const snap = await getDocs(collection(db(), COL.searchIndex))
  const weight = { appliance: 2, service: 1, issue: 0 } as const

  const scored: Array<{ row: SearchRow; score: number }> = []
  for (const each of snap.docs) {
    const row = each.data() as SearchRow
    const label = row.label.toLowerCase()
    let score: number = weight[row.kind]
    for (const term of terms) {
      let best = 0
      for (const token of row.tokens) {
        if (token === term) best = Math.max(best, 3)
        else if (token.startsWith(term)) best = Math.max(best, 2)
      }
      if (best === 0 && label.includes(term)) best = 1
      if (best === 0) {
        score = 0
        break
      }
      score += best
    }
    if (score > 0) scored.push({ row, score })
  }

  scored.sort(
    (a, b) => b.score - a.score || a.row.label.localeCompare(b.row.label)
  )

  return scored.slice(0, 20).map(({ row }) => ({
    kind: row.kind,
    applianceId: row.applianceId,
    ...(row.serviceKey === undefined ? {} : { serviceKey: row.serviceKey }),
    ...(row.issueId === undefined ? {} : { issueId: row.issueId }),
    label: row.label,
    ...(row.sublabel === undefined ? {} : { sublabel: row.sublabel }),
    href: row.href,
  }))
}

type SearchRow = SearchHit & { tokens: string[] }
