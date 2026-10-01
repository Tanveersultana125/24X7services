'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seed, type Seed } from './seed'
import type {
  Activity,
  ActivityKind,
  AdminSettings,
  Booking,
  BookingStatus,
  Broadcast,
  Coupon,
  Customer,
  KycStatus,
  Payout,
  Review,
  Technician,
  Ticket,
  TicketStatus,
} from './types'

/**
 * The console's state, kept on the device.
 *
 * Like the two apps it oversees, the console has no backend yet: the seeded
 * network lives here and every action — assigning, refunding, approving a
 * technician — is applied to it and saved to localStorage. Storage can be
 * unavailable, so reads and writes are guarded and the console runs from the
 * seed instead.
 */

const KEY = 'admin.state.v1'

export const ADMIN = { name: 'Aditi Rao', role: 'Super admin', email: 'aditi.rao@24x7services.in' }

interface Persisted extends Seed {
  signedIn: boolean
  seededOn: string
  /** Notification ids the admin has opened. */
  seen: string[]
}

function fresh(): Persisted {
  return { ...seed(), signedIn: true, seededOn: new Date().toDateString(), seen: [] }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Persisted
      // The demo month is rebuilt each day so "today" never goes stale; the
      // console's own settings carry over.
      if (saved.seededOn === new Date().toDateString()) return { ...saved, signedIn: true }
      return { ...fresh(), settings: saved.settings }
    }
  } catch {
    /* storage unavailable — run from the seed */
  }
  return fresh()
}

let seq = 1

interface Store extends Persisted {
  ready: boolean
  signIn: () => void
  signOut: () => void
  customer: (id: string) => Customer | undefined
  technician: (id?: string) => Technician | undefined
  /** Assign or reassign a booking; moves an unassigned booking to Assigned. */
  assign: (bookingId: string, techId: string) => void
  setStatus: (bookingId: string, status: BookingStatus, note?: string) => void
  cancel: (bookingId: string, reason: string) => void
  refund: (bookingId: string) => void
  reschedule: (bookingId: string, iso: string) => void
  setCustomerStatus: (id: string, status: Customer['status']) => void
  addWalletCredit: (id: string, amount: number) => void
  setKyc: (id: string, kyc: KycStatus) => void
  setDoc: (id: string, doc: keyof Technician['docs'], on: boolean) => void
  settleCash: (id: string) => void
  payOut: (ids: string[]) => void
  replyTicket: (id: string, text: string) => void
  setTicketStatus: (id: string, status: TicketStatus) => void
  assignTicket: (id: string, who: string) => void
  setReviewStatus: (id: string, status: Review['status']) => void
  saveCoupon: (c: Coupon) => void
  toggleCoupon: (code: string) => void
  sendBroadcast: (b: Omit<Broadcast, 'id' | 'at' | 'reach'>) => void
  updateSettings: (patch: Partial<AdminSettings> | ((s: AdminSettings) => Partial<AdminSettings>)) => void
  markSeen: (ids: string[]) => void
  resetDemo: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(fresh)
  const [ready, setReady] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    // Read storage only after mount: the static HTML is built on a machine
    // with a different clock, so rendering the seed there would never match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load())
    loaded.current = true
    setReady(true)
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota — the session still works */
    }
  }, [state])

  const log = useCallback((kind: ActivityKind, text: string) => {
    const a: Activity = { id: `AC-L${Date.now()}-${seq++}`, kind, text, at: new Date().toISOString(), actor: ADMIN.name }
    setState((s) => ({ ...s, activity: [a, ...s.activity].slice(0, 200) }))
  }, [])

  const patchBooking = useCallback((id: string, fn: (b: Booking) => Booking) => {
    setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? fn(b) : b)) }))
  }, [])

  const value = useMemo<Store>(() => {
    const now = () => new Date().toISOString()
    const tech = (id?: string) => state.technicians.find((t) => t.id === id)
    return {
      ...state,
      ready,
      signIn: () => setState((s) => ({ ...s, signedIn: true })),
      signOut: () => setState((s) => ({ ...s, signedIn: false })),
      customer: (id) => state.customers.find((c) => c.id === id),
      technician: tech,
      assign: (bookingId, techId) => {
        const b = state.bookings.find((x) => x.id === bookingId)
        patchBooking(bookingId, (x) => {
          const first = x.status === 'confirmed' || x.status === 'pending_payment'
          return {
            ...x,
            technicianId: techId,
            status: first ? 'assigned' : x.status,
            timeline: [...x.timeline, { status: 'assigned', at: now(), note: first ? undefined : `Reassigned to ${tech(techId)?.name}` }],
          }
        })
        log('dispatch', `${bookingId} ${b?.technicianId ? 'reassigned' : 'assigned'} to ${tech(techId)?.name}`)
      },
      setStatus: (bookingId, status, note) => {
        patchBooking(bookingId, (x) => ({
          ...x,
          status,
          paid: status === 'completed' ? true : x.paid,
          timeline: [...x.timeline, { status, at: now(), note }],
        }))
        log('booking', `${bookingId} marked ${status.replace('_', ' ')}`)
      },
      cancel: (bookingId, reason) => {
        patchBooking(bookingId, (x) => ({ ...x, status: 'cancelled', cancelReason: reason, timeline: [...x.timeline, { status: 'cancelled', at: now(), note: reason }] }))
        log('booking', `${bookingId} cancelled — ${reason}`)
      },
      refund: (bookingId) => {
        const b = state.bookings.find((x) => x.id === bookingId)
        patchBooking(bookingId, (x) => ({
          ...x,
          status: 'refunded',
          timeline: [...x.timeline, ...(x.status !== 'cancelled' ? [{ status: 'cancelled' as const, at: now() }] : []), { status: 'refunded', at: now() }],
        }))
        log('payment', `Refund of ₹${b?.amount.toLocaleString('en-IN')} issued for ${bookingId}`)
      },
      reschedule: (bookingId, iso) => {
        patchBooking(bookingId, (x) => ({ ...x, scheduledAt: iso }))
        log('booking', `${bookingId} rescheduled`)
      },
      setCustomerStatus: (id, status) => {
        setState((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? { ...c, status } : c)) }))
        log('customer', `${state.customers.find((c) => c.id === id)?.name} ${status === 'blocked' ? 'blocked' : 'unblocked'}`)
      },
      addWalletCredit: (id, amount) => {
        setState((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? { ...c, walletCredit: c.walletCredit + amount } : c)) }))
        log('customer', `₹${amount} wallet credit added for ${state.customers.find((c) => c.id === id)?.name}`)
      },
      setKyc: (id, kyc) => {
        setState((s) => ({
          ...s,
          technicians: s.technicians.map((t) => (t.id === id ? { ...t, kyc, presence: kyc === 'verified' ? t.presence : 'offline' } : t)),
        }))
        const verb: Record<KycStatus, string> = { verified: 'approved', rejected: 'rejected', suspended: 'suspended', pending: 'moved back to review' }
        log('technician', `${tech(id)?.name} ${verb[kyc]}`)
      },
      setDoc: (id, doc, on) =>
        setState((s) => ({ ...s, technicians: s.technicians.map((t) => (t.id === id ? { ...t, docs: { ...t.docs, [doc]: on } } : t)) })),
      settleCash: (id) => {
        const t = tech(id)
        setState((s) => ({ ...s, technicians: s.technicians.map((x) => (x.id === id ? { ...x, cashInHand: 0 } : x)) }))
        log('payment', `Cash deposit of ₹${t?.cashInHand.toLocaleString('en-IN')} recorded for ${t?.name}`)
      },
      payOut: (ids) => {
        const list = state.payouts.filter((p) => ids.includes(p.id) && p.status !== 'paid')
        setState((s) => ({ ...s, payouts: s.payouts.map((p): Payout => (ids.includes(p.id) ? { ...p, status: 'paid', at: now() } : p)) }))
        const total = list.reduce((sum, p) => sum + p.gross - p.commission, 0)
        log('payment', `${list.length} payout${list.length === 1 ? '' : 's'} released · ₹${total.toLocaleString('en-IN')}`)
      },
      replyTicket: (id, text) => {
        setState((s) => ({
          ...s,
          tickets: s.tickets.map(
            (t): Ticket =>
              t.id === id
                ? { ...t, status: t.status === 'open' ? 'in_progress' : t.status, assignee: t.assignee ?? ADMIN.name, messages: [...t.messages, { from: 'agent', text, at: now() }] }
                : t
          ),
        }))
        log('support', `Replied on ${id}`)
      },
      setTicketStatus: (id, status) => {
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) =>
            t.id === id
              ? { ...t, status, messages: status === 'resolved' ? [...t.messages, { from: 'system' as const, text: `Marked resolved by ${ADMIN.name}`, at: now() }] : t.messages }
              : t
          ),
        }))
        log('support', `${id} ${status === 'resolved' ? 'resolved' : 'reopened'}`)
      },
      assignTicket: (id, who) => {
        setState((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === id ? { ...t, assignee: who } : t)) }))
        log('support', `${id} assigned to ${who}`)
      },
      setReviewStatus: (id, status) => {
        setState((s) => ({ ...s, reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)) }))
        log('customer', `Review ${id} ${status}`)
      },
      saveCoupon: (c) => {
        const exists = state.coupons.some((x) => x.code === c.code)
        setState((s) => ({ ...s, coupons: exists ? s.coupons.map((x) => (x.code === c.code ? c : x)) : [c, ...s.coupons] }))
        log('system', `Coupon ${c.code} ${exists ? 'updated' : 'created'}`)
      },
      toggleCoupon: (code) => {
        const c = state.coupons.find((x) => x.code === code)
        setState((s) => ({ ...s, coupons: s.coupons.map((x) => (x.code === code ? { ...x, active: !x.active } : x)) }))
        log('system', `Coupon ${code} ${c?.active ? 'paused' : 'activated'}`)
      },
      sendBroadcast: (b) => {
        const reach =
          b.audience === 'customers'
            ? state.customers.filter((c) => c.status === 'active').length
            : b.audience === 'technicians'
              ? state.technicians.filter((t) => t.kyc === 'verified').length
              : state.customers.filter((c) => c.status === 'active').length + state.technicians.filter((t) => t.kyc === 'verified').length
        setState((s) => ({ ...s, broadcasts: [{ ...b, id: `BC-${42 + s.broadcasts.length}`, at: now(), reach }, ...s.broadcasts] }))
        log('system', `Push sent to ${b.audience}: “${b.title}”`)
      },
      updateSettings: (patch) => {
        setState((s) => ({ ...s, settings: { ...s.settings, ...(typeof patch === 'function' ? patch(s.settings) : patch) } }))
      },
      markSeen: (ids) => setState((s) => ({ ...s, seen: [...new Set([...s.seen, ...ids])] })),
      resetDemo: () => setState(fresh()),
    }
  }, [state, ready, patchBooking, log])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

/** Re-render on a clock, for "min ago" labels. */
export function useTick(ms = 30_000): number {
  const [t, setT] = useState(() => Date.now())
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), ms)
    return () => clearInterval(i)
  }, [ms])
  return t
}
