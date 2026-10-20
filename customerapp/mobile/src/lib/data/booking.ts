import { useCallback, useSyncExternalStore } from 'react'
import { z } from 'zod'
import {
  addressSchema,
  answerSchema,
  slotSchema,
  type Address,
  type Answer,
  type Booking,
  type CartItem,
  type PriceBreakup,
  type Question,
  type Slot,
} from '@app/shared/catalog-v2'

import { createLocalStore } from '@/lib/localStore'
import { BOOKINGS } from '@/lib/mock/bookings'
import { mockRequest } from '@/lib/mock/request'
import { kv } from '@/lib/storage'
import { useAsync, type AsyncState } from '@/lib/useAsync'
import { fetchQuestions } from './catalog'

/**
 * A booking on its way through checkout: the answers to the questions, the
 * address and the slot. Kept on the device, so leaving halfway and coming back
 * finds it as it was. The cart is the other half (lib/data/cart); together
 * they become a booking at the payment step.
 */

const STORAGE_KEY = 'customerapp.checkout.v1'

const draftSchema = z.object({
  answers: z.record(z.string(), answerSchema).default({}),
  address: addressSchema.nullable().default(null),
  slot: slotSchema.nullable().default(null),
})
export type CheckoutDraft = z.infer<typeof draftSchema>

const EMPTY: CheckoutDraft = { answers: {}, address: null, slot: null }

const draftStore = createLocalStore<CheckoutDraft>({
  storageKey: STORAGE_KEY,
  read: () => {
    try {
      const parsed = draftSchema.safeParse(JSON.parse(kv.getItem(STORAGE_KEY) ?? 'null'))
      return parsed.success ? parsed.data : EMPTY
    } catch {
      return EMPTY
    }
  },
  write: (value) => kv.setItem(STORAGE_KEY, JSON.stringify(value)),
  serverValue: EMPTY,
})

export function useCheckoutDraft(): CheckoutDraft {
  return useSyncExternalStore(draftStore.subscribe, draftStore.getSnapshot, draftStore.getServerSnapshot).value
}

function patch(change: Partial<CheckoutDraft>): void {
  draftStore.set({ ...draftStore.getSnapshot().value, ...change })
}

export function setAnswer(questionId: string, answer: Answer | null): void {
  const answers = { ...draftStore.getSnapshot().value.answers }
  if (answer === null || (Array.isArray(answer) && answer.length === 0) || answer === '') delete answers[questionId]
  else answers[questionId] = answer
  patch({ answers })
}

export function setCheckoutAddress(address: Address): void {
  patch({ address })
}

export function setCheckoutSlot(slot: Slot): void {
  patch({ slot })
}

export function clearCheckout(): void {
  draftStore.set(EMPTY)
}

/** True when every required question has an answer. */
export function questionsDone(questions: readonly Question[], answers: CheckoutDraft['answers']): boolean {
  return questions.every((q) => !q.required || answers[q.id] !== undefined)
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Every question the services in the cart ask, each once, in order. */
export async function fetchCartQuestions(serviceIds: readonly string[]): Promise<Question[]> {
  const lists = await Promise.all([...new Set(serviceIds)].map((id) => fetchQuestions(id)))
  const byId = new Map<string, Question>()
  for (const q of lists.flat()) byId.set(q.id, q)
  return [...byId.values()].sort((a, b) => a.order - b.order)
}

export function useCartQuestions(serviceIds: readonly string[]): AsyncState<Question[]> {
  const key = [...new Set(serviceIds)].sort().join(',')
  return useAsync(useCallback(() => fetchCartQuestions(key ? key.split(',') : []), [key]))
}

/** One start time on one day, and whether it can still be booked. */
export interface SlotOption {
  start: string
  available: boolean
}
export interface SlotDay {
  date: string
  slots: SlotOption[]
}

const STARTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The next `days` days of start times. Today's starts within the next two
 * hours are shut (a professional needs time to get there), and a few others
 * are taken, varying by day, so the screen has something greyed to draw.
 */
export function fetchSlots(days = 7, now: Date = new Date()): Promise<SlotDay[]> {
  const result: SlotDay[] = []
  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const slots = STARTS.map((start, index) => {
      const [h, m] = start.split(':').map(Number) as [number, number]
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
      const tooSoon = at.getTime() - now.getTime() < 2 * 60 * 60 * 1000
      const taken = (index + i) % 5 === 0
      return { start, available: !tooSoon && !taken }
    })
    result.push({ date: dateKey(day), slots })
  }
  return mockRequest(result)
}

export function useSlots(): AsyncState<SlotDay[]> {
  return useAsync(useCallback(() => fetchSlots(), []))
}

// ---------------------------------------------------------------------------
// Placing the booking
// ---------------------------------------------------------------------------

export type PaymentMethod = 'upi' | 'card' | 'netbanking'

/**
 * Pays and books. The backend swap replaces this with: create the booking
 * (pending_payment), open Razorpay with its order, and confirm on the
 * payment callback. Here the payment always succeeds and the booking is
 * confirmed straight away, so the screens after it have a booking to show.
 */
export async function placeBooking(input: {
  uid: string
  categoryId: string
  items: CartItem[]
  draft: CheckoutDraft
  price: PriceBreakup
  method: PaymentMethod
}): Promise<Booking> {
  const { draft } = input
  if (!draft.address || !draft.slot) throw new Error('Choose an address and a slot first.')
  const now = new Date().toISOString()
  const booking: Booking = {
    id: `BK${Math.floor(1000 + Math.random() * 9000)}`,
    uid: input.uid,
    categoryId: input.categoryId,
    items: input.items,
    answers: draft.answers,
    address: draft.address,
    slot: draft.slot,
    status: 'confirmed',
    price: input.price,
    timeline: [{ status: 'confirmed', at: now }],
    photos: { before: [], after: [] },
    createdAt: now,
  }
  await mockRequest(undefined)
  BOOKINGS.unshift(booking)
  return booking
}
