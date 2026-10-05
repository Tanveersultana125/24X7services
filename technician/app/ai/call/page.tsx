'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Headset, Mic, MicOff, Pencil, Phone, PhoneOff, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { CallMark } from '@/components/ai/AiMark'
import { JobNotFound } from '@/components/JobParts'
import { BrandTag } from '@/components/glyphs'
import { Card, Page, ScreenHeader, SectionTitle, Toggle, inputClass } from '@/components/ui'
import { PURPOSE_HINT, PURPOSE_LABEL, RESULT_LABEL, SCENARIO_LABEL, planCall, purposeAvailability, scenariosFor, type CallPlan } from '@/lib/ai/call'
import type { CallLine, CallPurpose, CallRecord, CallScenario } from '@/lib/ai/types'
import { APPLIANCE_LABEL, BRAND_LABEL, applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { dayLabel, driveProgress, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useJob, useStore } from '@/lib/store'
import type { Job } from '@/lib/types'

export default function AiCallPage() {
  return (
    <Suspense>
      <AiCall />
    </Suspense>
  )
}

const PURPOSES: CallPurpose[] = ['confirm', 'eta', 'details', 'reschedule', 'status', 'followup']
const uid = () => Math.random().toString(36).slice(2, 10)

/** 00:02:34 */
const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')

function AiCall() {
  const params = useSearchParams()
  const job = useJob(params.get('id'))
  if (!job) return <JobNotFound />
  return <CallFlow key={job.id} job={job} initial={params.get('purpose') as CallPurpose | null} />
}

function CallFlow({ job, initial }: { job: Job; initial: CallPurpose | null }) {
  const availability = purposeAvailability(job)
  const firstOpen = PURPOSES.find((p) => !availability[p]) ?? 'status'
  const [purpose, setPurpose] = useState<CallPurpose>(initial && !availability[initial] ? initial : firstOpen)
  const [scenario, setScenario] = useState<CallScenario>('cooperative')
  const [stage, setStage] = useState<'setup' | 'call' | 'summary'>('setup')
  const [record, setRecord] = useState<CallRecord | null>(null)

  const scenarios = scenariosFor(purpose)
  const pickPurpose = (p: CallPurpose) => {
    setPurpose(p)
    if (!scenariosFor(p).includes(scenario)) setScenario('cooperative')
  }

  return (
    <>
      <ScreenHeader back={stepHref('detail', job.id)} title={stage === 'summary' ? 'Call summary' : 'AI Customer Call'} subtitle={`${job.id} · ${job.customer.name}`} />
      {stage === 'setup' && (
        <Setup
          job={job}
          purpose={purpose}
          onPurpose={pickPurpose}
          availability={availability}
          scenario={scenario}
          scenarios={scenarios}
          onScenario={setScenario}
          onStart={() => setStage('call')}
        />
      )}
      {stage === 'call' && (
        <LiveCall
          job={job}
          purpose={purpose}
          scenario={scenario}
          onEnded={(r) => {
            setRecord(r)
            setStage('summary')
          }}
        />
      )}
      {stage === 'summary' && record && <Summary job={job} record={record} onChange={setRecord} onAgain={() => setStage('setup')} />}
    </>
  )
}

/* ------------------------------------------------------------------ Setup */

function Setup({
  job,
  purpose,
  onPurpose,
  availability,
  scenario,
  scenarios,
  onScenario,
  onStart,
}: {
  job: Job
  purpose: CallPurpose
  onPurpose: (p: CallPurpose) => void
  availability: Record<CallPurpose, string | null>
  scenario: CallScenario
  scenarios: CallScenario[]
  onScenario: (s: CallScenario) => void
  onStart: () => void
}) {
  return (
    <Page className="mx-auto max-w-2xl space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <CallMark size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold">AI Customer Call</p>
            <p className="text-xs font-semibold text-muted">Automated service assistant · routine updates only</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
          <Field label="Customer" value={job.customer.name} />
          <Field label="Appliance" value={<span className="flex items-center gap-1.5"><BrandTag brand={job.brand} /> {APPLIANCE_LABEL[job.appliance]}</span>} />
          <Field label="Issue" value={job.issue} wide />
          <Field label="Appointment" value={`${dayLabel(job.scheduledAt)} · ${time(job.scheduledAt)}`} />
          <Field label="Phone" value={<span className="num">{job.customer.phone}</span>} />
        </dl>
      </Card>

      <section>
        <SectionTitle>Purpose</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {PURPOSES.map((p) => {
            const blocked = availability[p]
            const active = purpose === p
            return (
              <button
                key={p}
                type="button"
                disabled={!!blocked}
                onClick={() => onPurpose(p)}
                aria-pressed={active}
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                  active ? 'border-brand bg-brand-soft' : 'border-line bg-card hover:border-line-strong',
                  blocked && 'cursor-not-allowed opacity-55'
                )}
              >
                <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2', active ? 'border-brand bg-brand text-white' : 'border-line-strong')}>
                  {active && <Check className="size-3" strokeWidth={3.5} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{PURPOSE_LABEL[p]}</span>
                  <span className={cn('block text-xs font-medium', blocked ? 'text-warning' : 'text-muted')}>{blocked ?? PURPOSE_HINT[p]}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle action={<span className="rounded-md bg-violet-soft px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-violet">Demo line</span>}>Customer response</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scenario === s}
              onClick={() => onScenario(s)}
              className={cn('h-10 rounded-pill border px-4 text-[13px] font-bold transition-colors', scenario === s ? 'border-ink bg-ink text-white' : 'border-line-strong bg-card text-ink-2 hover:border-ink-2')}
            >
              {SCENARIO_LABEL[s]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-muted">No phone line is connected in this build, so the customer’s side is simulated from this choice.</p>
      </section>

      <div className="flex gap-2.5 rounded-xl border border-line bg-card p-3 text-xs font-medium text-ink-2">
        <ShieldCheck className="size-4 shrink-0 text-success" />
        <p>The assistant introduces itself as automated, never shares an ETA the system doesn’t have, and never confirms prices, refunds or new slots. Anything sensitive is handed to a person.</p>
      </div>

      <button type="button" onClick={onStart} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-success text-base font-extrabold text-white hover:brightness-95">
        <Phone className="size-5" /> Start Call
      </button>
    </Page>
  )
}

function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{label}</dt>
      <dd className="mt-0.5 font-bold">{value}</dd>
    </div>
  )
}

/* --------------------------------------------------------------- Live call */

type Status = 'connecting' | 'connected' | 'ended'

function useSpeech(muted: boolean) {
  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        const u = new SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices()
        u.voice = voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en')) ?? null
        u.rate = 1.05
        window.speechSynthesis.speak(u)
      } catch {
        /* no speech on this device */
      }
    },
    [muted]
  )
  const stop = useCallback(() => {
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* ignore */
    }
  }, [])
  return { speak, stop }
}

function LiveCall({ job, purpose, scenario, onEnded }: { job: Job; purpose: CallPurpose; scenario: CallScenario; onEnded: (r: CallRecord) => void }) {
  const [plan] = useState<CallPlan>(() => {
    // An ETA only exists while the technician is driving; otherwise the plan
    // gets none and the assistant says so.
    const eta = job.status === 'on_the_way' ? Math.max(1, Math.round(job.etaMin * (1 - driveProgress(job, Date.now())))) : undefined
    return planCall(job, purpose, scenario, eta)
  })
  const [status, setStatus] = useState<Status>('connecting')
  const [shown, setShown] = useState(0)
  const [speaking, setSpeaking] = useState<CallLine['speaker'] | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const { speak, stop } = useSpeech(muted)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const secondsRef = useRef(0)

  const finish = useCallback(
    (count: number, early: boolean) => {
      if (done.current) return
      done.current = true
      timers.current.forEach(clearTimeout)
      stop()
      setSpeaking(null)
      setStatus('ended')
      const transcript = plan.lines.slice(0, count)
      const record: CallRecord = {
        id: uid(),
        jobId: job.id,
        purpose,
        scenario,
        at: new Date().toISOString(),
        durationSec: secondsRef.current,
        transcript,
        result: early ? 'informed' : plan.result,
        summary: early ? { result: 'Call ended early by the technician before the assistant finished.', followUp: true } : plan.summary,
        saved: false,
      }
      timers.current.push(setTimeout(() => onEnded(record), 1100))
    },
    [job.id, onEnded, plan, purpose, scenario, stop]
  )

  // The playback effect runs once; these keep it calling the latest versions.
  const speakRef = useRef(speak)
  const finishRef = useRef(finish)
  useEffect(() => {
    speakRef.current = speak
    finishRef.current = finish
  }, [speak, finish])

  // Play the plan: connect, then each line after the last has been "spoken".
  useEffect(() => {
    let at = 2200
    timers.current.push(setTimeout(() => setStatus('connected'), at))
    plan.lines.forEach((line, i) => {
      const start = at + 350
      const dur = Math.max(1500, line.text.length * 58)
      timers.current.push(
        setTimeout(() => {
          setShown(i + 1)
          setSpeaking(line.speaker)
          if (line.speaker === 'ai') speakRef.current(line.text)
        }, start)
      )
      timers.current.push(setTimeout(() => setSpeaking(null), start + dur))
      at = start + dur
    })
    timers.current.push(setTimeout(() => finishRef.current(plan.lines.length, false), at + 600))
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      window.speechSynthesis?.cancel()
    }
  }, [plan])

  useEffect(() => {
    if (status !== 'connected') return
    const i = setInterval(() => {
      secondsRef.current += 1
      setSeconds(secondsRef.current)
    }, 1000)
    return () => clearInterval(i)
  }, [status])

  const lines = plan.lines.slice(0, shown)
  const escalated = plan.result === 'escalated' && shown >= plan.lines.length - 2

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [shown, escalated])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-[calc(9rem+var(--safe-bottom))] pt-4 lg:pb-10">
      {/* Call header */}
      <div className="overflow-hidden rounded-card bg-brand-ink text-white shadow-float">
        <div className="flex items-center gap-3 px-4 pt-4">
          <CallMark size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold">AI Service Assistant</p>
            <p className="truncate text-xs font-semibold text-white/60">
              Calling {job.customer.name} · {PURPOSE_LABEL[purpose]}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-end justify-between gap-4 px-4 pb-4 pt-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/50">Call duration</p>
            <p className="num text-3xl font-extrabold tracking-tight">{clock(seconds)}</p>
          </div>
          <Waveform speaker={speaking} />
        </div>
        <p className="border-t border-white/10 px-4 py-2 text-[11.5px] font-semibold text-white/60">
          {status === 'connecting' ? 'Dialling the customer…' : status === 'ended' ? 'Call ended — preparing summary' : speaking === 'ai' ? 'Assistant speaking' : speaking === 'customer' ? 'Customer speaking' : 'Listening'}
        </p>
      </div>

      {/* Transcript */}
      <section className="mt-5">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">Live transcript</p>
        {lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm font-medium text-muted">The transcript appears here once the customer answers.</p>
        ) : (
          <ol className="space-y-2.5">
            {lines.map((l, i) => (
              <Line key={i} line={l} />
            ))}
          </ol>
        )}
      </section>

      {escalated && (
        <div className="animate-slide-up mt-4 rounded-card border border-danger/30 bg-danger-soft p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-danger">
            <TriangleAlert className="size-4" /> Human Assistance Required
          </p>
          <p className="mt-1 text-xs font-medium text-ink-2">{plan.summary.escalation} — outside what the assistant can handle.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={telHref(job.customer.phone)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-danger text-sm font-extrabold text-white">
              <Phone className="size-4" /> Take over call
            </a>
            <Link href="/support" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-danger/30 bg-card text-sm font-extrabold text-danger">
              <Headset className="size-4" /> Contact Support
            </Link>
          </div>
        </div>
      )}

      <div ref={endRef} className="scroll-mb-40 lg:scroll-mb-28" />


      {/* Controls */}
      <div className="fixed inset-x-0 bottom-[calc(64px+var(--safe-bottom))] z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-4 lg:mt-6 lg:rounded-card lg:border">
        <div className="mx-auto flex max-w-2xl gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMuted((m) => !m)
              stop()
            }}
            disabled={status === 'ended'}
            aria-pressed={muted}
            className={cn('flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-[15px] font-extrabold disabled:opacity-50', muted ? 'border-ink bg-ink text-white' : 'border-line-strong bg-card')}
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />} {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            disabled={status === 'ended'}
            onClick={() => finish(shown, shown < plan.lines.length)}
            className="flex h-14 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-danger text-[15px] font-extrabold text-white hover:brightness-95 disabled:opacity-50"
          >
            <PhoneOff className="size-5" /> End Call
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const tone = { connecting: 'bg-warning/20 text-[#fcd28d]', connected: 'bg-success/25 text-[#86efac]', ended: 'bg-white/10 text-white/60' }[status]
  return (
    <span className={cn('flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10.5px] font-extrabold tracking-[0.12em]', tone)}>
      <span className={cn('size-1.5 rounded-full bg-current', status !== 'ended' && 'animate-blink')} />
      {status.toUpperCase()}
    </span>
  )
}

/** Bars that move while someone is talking and rest flat in the pauses. */
function Waveform({ speaker }: { speaker: CallLine['speaker'] | null }) {
  const bars = [0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.35, 0.75, 0.55, 1, 0.45, 0.7, 0.3, 0.85, 0.5, 0.65]
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full transition-colors', speaker ? 'animate-wave' : '', speaker === 'customer' ? 'bg-[#86efac]' : speaker === 'ai' ? 'bg-white' : 'bg-white/25')}
          style={{ height: speaker ? `${h * 100}%` : '4px', animationDelay: `${(i % 5) * 110}ms`, animationDuration: `${700 + (i % 4) * 120}ms` }}
        />
      ))}
    </div>
  )
}

function Line({ line }: { line: CallLine }) {
  const ai = line.speaker === 'ai'
  return (
    <li className={cn('animate-slide-up flex', ai ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed', ai ? 'rounded-tl-md border border-line bg-card' : 'rounded-tr-md bg-success-soft')}>
        <p className={cn('mb-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em]', ai ? 'text-brand' : 'text-success')}>{ai ? 'AI assistant' : 'Customer'}</p>
        <p className="font-medium text-ink">{line.text}</p>
      </div>
    </li>
  )
}

/* ----------------------------------------------------------------- Summary */

function Summary({ job, record, onChange, onAgain }: { job: Job; record: CallRecord; onChange: (r: CallRecord) => void; onAgain: () => void }) {
  const store = useStore()
  const [editing, setEditing] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const s = record.summary
  const tone = record.result === 'escalated' ? 'bg-danger-soft text-danger' : record.result === 'reschedule_requested' || record.result === 'follow_up' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'

  const set = (patch: Partial<CallRecord['summary']>) => onChange({ ...record, saved: false, summary: { ...s, ...patch } })

  return (
    <Page className="mx-auto max-w-2xl space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line p-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-faint">Call summary</p>
            <p className="num text-xs font-semibold text-muted">
              {time(record.at)} · {clock(record.durationSec)}
            </p>
          </div>
          <span className={cn('rounded-md px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider', tone)}>{RESULT_LABEL[record.result]}</span>
        </div>
        <dl className="divide-y divide-line text-sm">
          <Row label="Customer" value={job.customer.name} />
          <Row label="Brand" value={BRAND_LABEL[job.brand]} />
          <Row label="Appliance" value={APPLIANCE_LABEL[job.appliance]} />
          <Row label="Purpose" value={PURPOSE_LABEL[record.purpose]} />
          <Row
            label="Result"
            value={editing ? <textarea value={s.result} onChange={(e) => set({ result: e.target.value })} rows={2} className={cn(inputClass, 'py-2 text-sm')} /> : s.result}
          />
          {s.eta && <Row label="ETA" value={s.eta} />}
          {(s.request || editing) && (
            <Row
              label="Customer request"
              value={editing ? <input value={s.request ?? ''} onChange={(e) => set({ request: e.target.value })} className={cn(inputClass, 'py-2 text-sm')} placeholder="None" /> : s.request}
            />
          )}
          {s.reschedule && (
            <Row
              label="Reschedule"
              value={
                <span>
                  <span className="mb-1 inline-block rounded-md bg-warning-soft px-2 py-0.5 text-[10.5px] font-extrabold tracking-wider text-warning">RESCHEDULING REQUESTED</span>
                  <span className="block">
                    {s.reschedule.date} · {s.reschedule.time}
                  </span>
                  <span className="block text-xs font-medium text-muted">Reason: {s.reschedule.reason} · awaiting slot confirmation</span>
                </span>
              }
            />
          )}
          {s.satisfaction && <Row label="Satisfaction" value={s.satisfaction} />}
          {s.resolved !== undefined && <Row label="Issue resolved" value={<YesNo yes={s.resolved} />} />}
          {s.escalation && <Row label="Escalation" value={<span className="font-extrabold text-danger">{s.escalation}</span>} />}
          <Row
            label="Follow-up"
            value={editing ? <Toggle checked={s.followUp} onChange={(v) => set({ followUp: v })} label="Follow-up required" /> : s.followUp ? 'Required' : 'Not required'}
          />
        </dl>
        <button type="button" onClick={() => setShowTranscript((v) => !v)} className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-sm font-extrabold text-brand">
          Transcript · {record.transcript.length} lines
          <ChevronDown className={cn('size-4 transition-transform', showTranscript && 'rotate-180')} />
        </button>
        {showTranscript && (
          <ol className="space-y-2 border-t border-line bg-canvas/60 p-4">
            {record.transcript.map((l, i) => (
              <Line key={i} line={l} />
            ))}
          </ol>
        )}
      </Card>

      {record.result === 'escalated' && (
        <div className="grid grid-cols-2 gap-2">
          <a href={telHref(job.customer.phone)} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-card text-sm font-extrabold">
            <Phone className="size-4 text-success" /> Call customer
          </a>
          <Link href="/support" className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-card text-sm font-extrabold">
            <Headset className="size-4 text-brand" /> Contact Support
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setEditing((e) => !e)} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-line-strong bg-card text-sm font-extrabold">
          <Pencil className="size-4" /> {editing ? 'Done' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={() => {
            const saved = { ...record, saved: true }
            store.saveCall(saved)
            onChange(saved)
            setEditing(false)
          }}
          className={cn('flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-extrabold text-white', record.saved ? 'bg-success' : 'bg-brand hover:bg-brand-deep')}
        >
          {record.saved ? <Check className="size-4" /> : null}
          {record.saved ? 'Saved' : 'Save to Job'}
        </button>
        <button type="button" onClick={onAgain} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-line-strong bg-card text-sm font-extrabold">
          <RotateCcw className="size-4" /> Call Again
        </button>
      </div>
      {record.saved && (
        <Link href={stepHref('detail', job.id)} className="block text-center text-sm font-bold text-brand">
          Back to {applianceTitle(job.brand, job.appliance)}
        </Link>
      )}
    </Page>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-3">
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-faint">{label}</dt>
      <dd className="min-w-0 font-semibold">{value}</dd>
    </div>
  )
}

function YesNo({ yes }: { yes: boolean }) {
  return <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-extrabold', yes ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>{yes ? 'YES' : 'NO'}</span>
}
