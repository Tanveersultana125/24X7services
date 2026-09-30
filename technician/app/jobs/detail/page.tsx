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
  Navigation,
  Package,
  PenLine,
  Phone,
  Receipt,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react'
import { CustomerBlock, JobNotFound, JobSummary, ServiceSummary, useJobParam } from '@/components/JobParts'
import { ServiceMap } from '@/components/ServiceMap'
import { FlowBar, Timeline } from '@/components/Timeline'
import { ActionDock, Card, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { billTotal, directionsHref, driveProgress, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
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
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a href={telHref(job.customer.phone)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-card text-sm font-extrabold">
                    <Phone className="size-4 text-success" /> Call
                  </a>
                  <a href={`sms:${job.customer.phone.replace(/\s/g, '')}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-card text-sm font-extrabold">
                    <MessageCircle className="size-4 text-brand" /> Chat
                  </a>
                </div>
              </section>
            )}

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
