'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, TECHNICIAN, lateRequest, seedJobs, seedNotices } from './seed'
import { LABOUR_RATE, applianceTitle, inr } from './catalog'
import { billTotal } from './format'
import type { Bill, Confirmation, Diagnosis, FlowStep, Job, Notice, PartLine, Photo, Settings, Technician } from './types'

/**
 * The whole app's state, kept on the device.
 *
 * There is no dispatch backend yet, so this is the backend: jobs move through
 * their flow here and the result is written to localStorage, which is what
 * lets a technician close the tab mid-job and come back to the same step.
 * Storage can be unavailable (private mode, a locked-down WebView), so every
 * read and write is guarded and the app simply runs from the seed instead.
 */

const KEY = 'technician.state.v1'

interface Persisted {
  signedIn: boolean
  online: boolean
  jobs: Job[]
  notices: Notice[]
  tech: Technician
  settings: Settings
  lateDelivered: boolean
  seededOn: string
}

function fresh(): Persisted {
  return {
    signedIn: false,
    online: true,
    jobs: seedJobs(),
    notices: seedNotices(),
    tech: TECHNICIAN,
    settings: DEFAULT_SETTINGS,
    lateDelivered: false,
    seededOn: new Date().toDateString(),
  }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Persisted
      // The demo day is rebuilt each morning so "today" never goes stale,
      // but who is signed in and how they set the app up carries over.
      if (saved.seededOn === new Date().toDateString()) return saved
      return { ...fresh(), signedIn: saved.signedIn, tech: saved.tech, settings: saved.settings }
    }
  } catch {
    /* storage unavailable — run from the seed */
  }
  return fresh()
}

let noticeSeq = 100

interface Store extends Persisted {
  ready: boolean
  signIn: () => void
  signOut: () => void
  setOnline: (v: boolean) => void
  accept: (id: string) => void
  reject: (id: string) => void
  advance: (id: string, to: FlowStep) => void
  saveDiagnosis: (id: string, d: Diagnosis) => void
  setParts: (id: string, parts: PartLine[]) => void
  addPhoto: (id: string, photo: Photo) => void
  removePhoto: (id: string, photoId: string) => void
  saveBill: (id: string, bill: Bill) => void
  confirm: (id: string, c: Confirmation) => void
  markRead: (noticeId: string) => void
  markAllRead: () => void
  updateTech: (patch: Partial<Technician>) => void
  updateSettings: (patch: Partial<Settings>) => void
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
      /* photos can overflow the quota; the session still works */
    }
  }, [state])

  // A new request lands shortly after the technician is online, so the
  // incoming-request takeover is something the demo actually shows.
  useEffect(() => {
    if (!ready || !state.signedIn || !state.online || state.lateDelivered) return
    const t = setTimeout(() => {
      setState((s) => {
        if (s.lateDelivered) return s
        const job = lateRequest()
        return {
          ...s,
          lateDelivered: true,
          jobs: [job, ...s.jobs],
          notices: [
            {
              id: `n${noticeSeq++}`,
              kind: 'request',
              title: `New service request · ${job.distanceKm} km`,
              body: `${applianceTitle(job.brand, job.appliance)} — ${job.issue}. ${job.customer.area}.`,
              at: new Date().toISOString(),
              read: false,
              jobId: job.id,
            },
            ...s.notices,
          ],
        }
      })
    }, 45_000)
    return () => clearTimeout(t)
  }, [ready, state.signedIn, state.online, state.lateDelivered])

  const patchJob = useCallback((id: string, fn: (j: Job) => Job) => {
    setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === id ? fn(j) : j)) }))
  }, [])

  const notify = useCallback((n: Omit<Notice, 'id' | 'at' | 'read'>) => {
    setState((s) => ({
      ...s,
      notices: [{ ...n, id: `n${noticeSeq++}`, at: new Date().toISOString(), read: false }, ...s.notices],
    }))
  }, [])

  const value = useMemo<Store>(() => {
    const now = () => new Date().toISOString()
    return {
      ...state,
      ready,
      signIn: () => setState((s) => ({ ...s, signedIn: true })),
      signOut: () => setState((s) => ({ ...s, signedIn: false })),
      setOnline: (v) => setState((s) => ({ ...s, online: v })),
      accept: (id) =>
        patchJob(id, (j) => ({
          ...j,
          status: 'accepted',
          log: { ...j.log, assigned: j.log.assigned ?? now(), accepted: now() },
        })),
      reject: (id) => patchJob(id, (j) => ({ ...j, status: 'rejected' })),
      advance: (id, to) => {
        patchJob(id, (j) => {
          const next: Job = { ...j, status: to, log: { ...j.log, [to]: now() } }
          if (to === 'confirmation' && !j.bill) {
            next.bill = { labour: LABOUR_RATE[j.appliance], additional: 0, additionalNote: '', paid: false, method: null }
          }
          return next
        })
        if (to === 'closed') {
          const job = state.jobs.find((j) => j.id === id)
          if (job?.bill?.paid) {
            notify({
              kind: 'payment',
              title: `Payment ${job.bill.method === 'cash' ? 'collected' : 'received'} · ${inr(billTotal(job))}`,
              body: `${job.id} closed. ${job.bill.method === 'cash' ? 'Cash to be deposited at hub.' : 'UPI settled to your wallet.'}`,
              jobId: id,
            })
          }
        }
      },
      saveDiagnosis: (id, d) => patchJob(id, (j) => ({ ...j, diagnosis: d })),
      setParts: (id, parts) => patchJob(id, (j) => ({ ...j, parts })),
      addPhoto: (id, photo) => patchJob(id, (j) => ({ ...j, photos: [...j.photos, photo] })),
      removePhoto: (id, photoId) => patchJob(id, (j) => ({ ...j, photos: j.photos.filter((p) => p.id !== photoId) })),
      saveBill: (id, bill) => patchJob(id, (j) => ({ ...j, bill })),
      confirm: (id, c) => {
        patchJob(id, (j) => ({ ...j, confirmation: c }))
        const job = state.jobs.find((j) => j.id === id)
        if (job && c.rating) {
          notify({
            kind: 'rating',
            title: `New ${c.rating}★ rating`,
            body: `${job.customer.name}${c.review ? `: “${c.review}”` : ' rated your service.'}`,
            jobId: id,
          })
        }
      },
      markRead: (nid) =>
        setState((s) => ({ ...s, notices: s.notices.map((n) => (n.id === nid ? { ...n, read: true } : n)) })),
      markAllRead: () => setState((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) })),
      updateTech: (patch) => setState((s) => ({ ...s, tech: { ...s.tech, ...patch } })),
      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      resetDemo: () => setState({ ...fresh(), signedIn: true }),
    }
  }, [state, ready, patchJob, notify])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

export function useJob(id: string | null): Job | undefined {
  const { jobs } = useStore()
  return id ? jobs.find((j) => j.id === id) : undefined
}

/** Re-render on a clock, for "min ago" labels and the moving van. */
export function useTick(ms = 15_000): number {
  const [t, setT] = useState(() => Date.now())
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), ms)
    return () => clearInterval(i)
  }, [ms])
  return t
}
