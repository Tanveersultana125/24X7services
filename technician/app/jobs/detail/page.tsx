'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Suspense } from 'react'
import {
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
  MessageSquareText,
  NotebookPen,
  Navigation,
  Package,
  PenLine,
  Phone,
  PhoneCall,
  Receipt,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react'
import { AiMark, CallMark } from '@/components/ai/AiMark'
import { CustomerBlock, JobNotFound, JobSummary, ServiceSummary, useJobParam } from '@/components/JobParts'
import { ServiceMap } from '@/components/ServiceMap'
import { FlowBar, Timeline } from '@/components/Timeline'
import { ActionDock, Card, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, billTotal, directionsHref, driveProgress, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { PURPOSE_LABEL, RESULT_LABEL } from '@/lib/ai/call'
import { NEXT_ACTION, STATUS, stepIndex } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { FlowStep, Job } from '@/lib/types'

export default function JobDetailPage() {
  return (
    <Suspense>
      <JobDetail />
    </Suspense>
  )
}

const STATUS_BUTTONS: { label: string; to: FlowStep }[] = [
  { label: 'On The Way', to: 'on_the_way' },
  { label: 'Arrived', to: 'arrived' },
  { label: 'Start Diagnosis', to: 'diagnosis' },
  { label: 'Start Repair', to: 'repair' },
  { label: 'Complete Repair', to: 'repaired' },
  { label: 'Close Job', to: 'closed' },
]

/**
 * Where a step is done on its own screen rather than by a tap: diagnosis is
 * recorded before repair starts, the bill before sign-off, the signature
 * before the job can close.
 */
function gate(job: Job): { href: Route; label: string } | null {
  if (job.status === 'diagnosis' && !job.diagnosis) return { href: stepHref('diagnosis', job.id), label: 'Record diagnosis' }
  if (job.status === 'repaired') return { href: stepHref('bill', job.id), label: 'Generate Bill' }
  if (job.status === 'confirmation') return { href: stepHref('confirm', job.id), label: 'Customer confirmation' }
  return null
}

function JobDetail() {
  const job = useJobParam()
  const store = useStore()
  const now = useTick(5_000)
  if (!job) return <JobNotFound />

  const idx = job.status === 'closed' ? 99 : stepIndex(job.status)
  const next = NEXT_ACTION[job.status]
  const g = gate(job)
  const progress = driveProgress(job, now)
  const remaining = Math.max(1, Math.round(job.etaMin * (1 - progress)))
  const onSite = idx >= stepIndex('arrived')
  const cancelled = job.status === 'cancelled' || job.status === 'rejected'

  const tasks = [
    { icon: Stethoscope, label: 'Diagnosis', href: stepHref('diagnosis', job.id), done: !!job.diagnosis, detail: job.diagnosis ? job.diagnosis.category : 'Condition, fault, required repair', ready: idx >= stepIndex('diagnosis') },
    { icon: Package, label: 'Parts', href: stepHref('parts', job.id), done: job.parts.length > 0, detail: job.parts.length ? `${job.parts.reduce((s, p) => s + p.qty, 0)} items selected` : 'Select from van stock', ready: idx >= stepIndex('diagnosis') },
    { icon: Camera, label: 'Photos', href: stepHref('diagnosis', job.id) + '#photos', done: job.photos.length > 0, detail: job.photos.length ? `${job.photos.length} uploaded` : 'Appliance, damaged part, before / after', ready: onSite },
    { icon: Receipt, label: 'Service bill', href: stepHref('bill', job.id), done: !!job.bill?.paid, detail: job.bill ? `${inr(billTotal(job))} · ${job.bill.paid ? 'paid' : 'payment pending'}` : 'After repair is complete', ready: idx >= stepIndex('repaired') },
    { icon: PenLine, label: 'Customer sign-off', href: stepHref('confirm', job.id), done: !!job.confirmation?.signature || job.status === 'closed', detail: job.confirmation ? `Rated ${job.confirmation.rating}★` : 'Signature & rating', ready: idx >= stepIndex('confirmation') },
  ]

  return (
    <>
      <ScreenHeader
        back="/jobs"
        title={applianceTitle(job.brand, job.appliance)}
        subtitle={`${job.id} · ${STATUS[job.status].label} · ${time(job.scheduledAt)}`}
        right={
          !cancelled && (
            <a href={telHref(job.customer.phone)} aria-label="Call customer" className="grid size-11 place-items-center rounded-full bg-success-soft text-success">
              <Phone className="size-5" />
            </a>
          )
        }
      />
      <Page className="space-y-4">
        {cancelled ? (
          <div className="flex items-start gap-3 rounded-card border border-danger/30 bg-danger-soft p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="font-extrabold text-danger">{STATUS[job.status].label}</p>
              <p className="text-sm font-medium text-ink-2">{job.cancelReason ?? 'This job is no longer assigned to you.'}</p>
            </div>
          </div>
        ) : (
          <Card className="p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-faint">Job progress</p>
              <p className="num text-xs font-bold text-muted">
                Step {Math.min(idx + 1, 9)} of 9
              </p>
            </div>
            <FlowBar job={job} />
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4">
            {/* Location */}
            {!cancelled && job.status !== 'closed' && (
              <Card className="overflow-hidden">
                <ServiceMap
                  to={job.customer}
                  progress={progress}
                  pins={[{ id: job.id, lat: job.customer.lat, lng: job.customer.lng, tone: 'danger', label: job.customer.name.split(' ')[0] }]}
                />
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                      {onSite ? 'At customer location' : job.status === 'on_the_way' ? 'Arriving in' : 'Drive time'}
                    </p>
                    <p className="num text-lg font-extrabold leading-tight">
                      {onSite ? 'Arrived ' + (job.log.arrived ? time(job.log.arrived) : '') : `${job.status === 'on_the_way' ? remaining : job.etaMin} min`}
                      <span className="ml-2 text-sm font-bold text-muted">
                        {onSite ? '' : `· ${(job.distanceKm * (1 - progress)).toFixed(1)} km`}
                      </span>
                    </p>
                  </div>
                  <a
                    href={directionsHref(job.customer.lat, job.customer.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-deep"
                  >
                    <Navigation className="size-4" /> Navigate
                  </a>
                </div>
              </Card>
            )}

            <JobSummary job={job} />

            {/* Status buttons */}
            {!cancelled && (
              <section>
                <SectionTitle>Update status</SectionTitle>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STATUS_BUTTONS.map((b) => {
                    const target = b.to === 'closed' ? 99 : stepIndex(b.to)
                    const done = target <= idx
                    const isNext = next?.to === b.to || (b.to === 'closed' && job.status === 'confirmation')
                    const blocked = isNext && !!g
                    return (
                      <button
                        key={b.to}
                        type="button"
                        disabled={done || !isNext || blocked}
                        onClick={() => store.advance(job.id, b.to)}
                        className={cn(
                          'flex h-14 items-center justify-center gap-1.5 rounded-xl border-2 px-2 text-sm font-extrabold transition-colors',
                          done && 'border-success/20 bg-success-soft text-success',
                          isNext && !blocked && 'border-brand bg-brand text-white hover:bg-brand-deep',
                          isNext && blocked && 'border-brand/40 bg-brand-soft text-brand',
                          !done && !isNext && 'border-line bg-card text-faint'
                        )}
                      >
                        {done && <Check className="size-4" strokeWidth={3} />}
                        {b.label}
                      </button>
                    )
                  })}
                </div>
                {g && (
                  <p className="mt-2 text-xs font-semibold text-muted">
                    {job.status === 'diagnosis' && 'Record the diagnosis before starting the repair.'}
                    {job.status === 'repaired' && 'Generate the bill, then take the customer’s confirmation.'}
                    {job.status === 'confirmation' && 'Collect the customer’s signature and payment to close the job.'}
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="space-y-4">
            {!cancelled && (
              <section>
                <SectionTitle>Customer</SectionTitle>
                <CustomerBlock job={job} />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <QuickAction href={telHref(job.customer.phone)} icon={<Phone className="size-5" />} label="Call Customer" tone="text-success" />
                  <QuickAction href={`sms:${job.customer.phone.replace(/\s/g, '')}`} icon={<MessageCircle className="size-5" />} label="Chat Customer" tone="text-brand" />
                  <QuickAction href={`/ai/chat/?id=${job.id}`} icon={<AiMark size={22} />} label="Ask AI" internal />
                  <QuickAction href={`/ai/call/?id=${job.id}${job.status === 'closed' || job.status === 'confirmation' ? '&purpose=followup' : ''}`} icon={<CallMark size={22} />} label="AI Call" internal />
                </div>
              </section>
            )}

            {!cancelled && <AiAssistance job={job} />}

            {!cancelled && (
              <section>
                <SectionTitle>Service summary</SectionTitle>
                <ServiceSummary job={job} />
              </section>
            )}

            {!cancelled && (
              <section>
                <SectionTitle>Service record</SectionTitle>
                <Card className="divide-y divide-line">
                  {tasks.map((t) => {
                    const inner = (
                      <>
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', t.done ? 'bg-success-soft text-success' : t.ready ? 'bg-brand-soft text-brand' : 'bg-canvas text-faint')}>
                          {t.done ? <ClipboardCheck className="size-5" /> : <t.icon className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-sm font-extrabold', !t.ready && 'text-faint')}>{t.label}</span>
                          <span className="block truncate text-xs font-medium text-muted">{t.detail}</span>
                        </span>
                        {t.ready && <ChevronRight className="size-4 text-faint" />}
                      </>
                    )
                    return t.ready ? (
                      <Link key={t.label} href={t.href as Route} className="flex items-center gap-3 p-3 hover:bg-canvas">
                        {inner}
                      </Link>
                    ) : (
                      <div key={t.label} className="flex items-center gap-3 p-3" aria-disabled>
                        {inner}
                      </div>
                    )
                  })}
                </Card>
              </section>
            )}

            <section>
              <SectionTitle>Timeline</SectionTitle>
              <Card className="p-4">
                <Timeline job={job} />
              </Card>
            </section>
          </div>
        </div>

        {!cancelled && next && (
          <ActionDock>
            {g ? (
              <Link href={g.href} className="flex h-14 flex-1 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white hover:bg-brand-deep">
                {g.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => store.advance(job.id, next.to)}
                className={cn(
                  'h-14 flex-1 rounded-xl text-base font-extrabold text-white',
                  next.to === 'accepted' ? 'bg-success hover:brightness-95' : 'bg-brand hover:bg-brand-deep'
                )}
              >
                {next.label}
              </button>
            )}
          </ActionDock>
        )}
        {job.status === 'closed' && (
          <ActionDock>
            <Link href={stepHref('bill', job.id)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-line-strong text-base font-extrabold">
              <Receipt className="size-5" /> View service bill
            </Link>
          </ActionDock>
        )}
      </Page>
    </>
  )
}

function QuickAction({ href, icon, label, tone, internal }: { href: string; icon: React.ReactNode; label: string; tone?: string; internal?: boolean }) {
  const cls = 'flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-card px-1 text-center text-[11.5px] font-extrabold leading-tight hover:border-ink-2'
  const inner = (
    <>
      <span className={tone}>{icon}</span>
      {label}
    </>
  )
  return internal ? (
    <Link href={href as Route} className={cls}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {inner}
    </a>
  )
}

/**
 * Everything the AI helped with on this job: saved service notes, the
 * conversations to reopen, and call summaries.
 */
function AiAssistance({ job }: { job: Job }) {
  const { aiThreads, aiCalls } = useStore()
  const threads = aiThreads.filter((t) => t.jobId === job.id)
  const calls = aiCalls.filter((c) => c.jobId === job.id)
  const done = job.status === 'closed' || job.status === 'confirmation'
  const notes = job.serviceNotes

  return (
    <section>
      <SectionTitle count={threads.length + calls.length || undefined}>AI assistance</SectionTitle>
      <Card className="divide-y divide-line">
        <div className="grid grid-cols-2 gap-2 p-3">
          <Link href={`/ai/chat/?id=${job.id}&q=parts` as Route} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-canvas text-[13px] font-extrabold text-ink-2 hover:bg-brand-soft hover:text-brand">
            <Package className="size-4" /> Find Required Parts
          </Link>
          <Link href={`/ai/chat/?id=${job.id}&q=notes` as Route} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-canvas text-[13px] font-extrabold text-ink-2 hover:bg-brand-soft hover:text-brand">
            <NotebookPen className="size-4" /> Service Notes
          </Link>
          {done && (
            <Link href={`/ai/call/?id=${job.id}&purpose=followup` as Route} className="col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success-soft text-[13px] font-extrabold text-success">
              <PhoneCall className="size-4" /> AI Follow-up Call
            </Link>
          )}
        </div>

        {notes && (
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Service notes · saved {time(notes.savedAt)}</p>
            <dl className="mt-1.5 space-y-1.5 text-sm">
              <div>
                <dt className="inline font-extrabold">Diagnosis: </dt>
                <dd className="inline font-medium text-ink-2">{notes.diagnosis}</dd>
              </div>
              <div>
                <dt className="inline font-extrabold">Action taken: </dt>
                <dd className="inline font-medium text-ink-2">{notes.action}</dd>
              </div>
              <div>
                <dt className="inline font-extrabold">Recommendation: </dt>
                <dd className="inline font-medium text-ink-2">{notes.recommendation}</dd>
              </div>
            </dl>
          </div>
        )}

        {threads.map((t) => (
          <Link key={t.id} href={`/ai/chat/?id=${job.id}&t=${t.id}` as Route} className="flex items-center gap-3 p-3 hover:bg-canvas">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <MessageSquareText className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">{t.title}</span>
              <span className="block text-xs font-medium text-muted">
                AI chat · {t.messages.filter((m) => m.role === 'tech').length} questions · {ago(t.updatedAt)}
              </span>
            </span>
            <ChevronRight className="size-4 text-faint" />
          </Link>
        ))}

        {calls.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
              <PhoneCall className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-extrabold">{PURPOSE_LABEL[c.purpose]}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase',
                    c.result === 'escalated' ? 'bg-danger-soft text-danger' : c.result === 'reschedule_requested' || c.result === 'follow_up' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'
                  )}
                >
                  {RESULT_LABEL[c.result]}
                </span>
              </span>
              <span className="block text-xs font-medium text-ink-2">{c.summary.result}</span>
              {c.summary.request && <span className="block text-xs font-medium text-muted">Request: {c.summary.request}</span>}
              <span className="block text-[11px] font-semibold text-faint">AI call · {ago(c.at)}</span>
            </span>
          </div>
        ))}

        {!notes && threads.length === 0 && calls.length === 0 && (
          <p className="p-4 text-sm font-medium text-muted">Ask AI for diagnosis help or run an AI call — conversations and call summaries are kept here.</p>
        )}
      </Card>
    </section>
  )
}
