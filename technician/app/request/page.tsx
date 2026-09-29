'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { CircleCheck, CircleX, ClipboardList, Clock, IndianRupee, MessageCircle, Navigation, Phone, Route as RouteIcon, Siren } from 'lucide-react'
import { CustomerBlock, JobNotFound, JobSummary, useJobParam } from '@/components/JobParts'
import { ServiceMap } from '@/components/ServiceMap'
import { ActionDock, Card, Label, Page, ScreenHeader, SectionTitle } from '@/components/ui'
import { LABOUR_RATE, inr } from '@/lib/catalog'
import { ago, directionsHref, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'

export default function RequestPage() {
  return (
    <Suspense>
      <RequestScreen />
    </Suspense>
  )
}

function RequestScreen() {
  const job = useJobParam()
  const { accept, reject } = useStore()
  if (!job) return <JobNotFound />

  const emergency = job.priority === 'emergency'
  const accepted = job.status !== 'request' && job.status !== 'rejected'

  return (
    <>
      <ScreenHeader back="/home" title={accepted ? 'Job accepted' : 'New Service Request'} subtitle={`${job.id} · received ${ago(job.requestedAt)}`} />
      <Page className="space-y-4">
        {emergency && !accepted && (
          <div className="flex items-center gap-3 rounded-card bg-danger p-4 text-white">
            <Siren className="size-6 shrink-0" />
            <div>
              <p className="font-extrabold">Emergency · high priority</p>
              <p className="text-sm font-medium text-white/80">Customer needs a technician as soon as possible. Target arrival within 45 minutes.</p>
            </div>
          </div>
        )}

        {accepted && (
          <Card className="animate-slide-up overflow-hidden border-success/30">
            <div className="flex items-center gap-3 bg-success-soft p-4">
              <CircleCheck className="size-8 text-success" />
              <div>
                <p className="font-extrabold text-success">You’ve got this job</p>
                <p className="text-sm font-medium text-ink-2">Customer has been told you’re assigned. Head out when ready.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              <a href={directionsHref(job.customer.lat, job.customer.lng)} target="_blank" rel="noreferrer" className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl bg-brand text-sm font-extrabold text-white">
                <Navigation className="size-5" /> Start navigation
              </a>
              <a href={telHref(job.customer.phone)} className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-line-strong text-sm font-extrabold">
                <Phone className="size-5 text-success" /> Call customer
              </a>
              <a href={`sms:${job.customer.phone.replace(/\s/g, '')}`} className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-line-strong text-sm font-extrabold">
                <MessageCircle className="size-5 text-brand" /> Chat
              </a>
              <Link href={stepHref('detail', job.id)} className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-line-strong text-sm font-extrabold">
                <ClipboardList className="size-5 text-violet" /> Service details
              </Link>
            </div>
          </Card>
        )}

        {job.status === 'rejected' && (
          <div className="flex items-center gap-3 rounded-card border border-line-strong bg-card p-4">
            <CircleX className="size-6 text-muted" />
            <p className="text-sm font-semibold text-ink-2">You declined this request. Dispatch has offered it to the next technician.</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <JobSummary job={job} />
            <Card className="overflow-hidden">
              <ServiceMap to={job.customer} pins={[{ id: job.id, lat: job.customer.lat, lng: job.customer.lng, tone: emergency ? 'danger' : 'brand', label: job.customer.area }]} />
              <dl className="grid grid-cols-3 divide-x divide-line">
                <Metric icon={<RouteIcon className="size-4" />} label="Distance" value={`${job.distanceKm} km`} />
                <Metric icon={<Clock className="size-4" />} label="Drive" value={`~${job.etaMin} min`} />
                <Metric icon={<Clock className="size-4" />} label="Requested" value={emergency ? 'ASAP' : time(job.scheduledAt)} />
              </dl>
            </Card>
          </div>
          <div className="space-y-4">
            <section>
              <SectionTitle>Customer</SectionTitle>
              <CustomerBlock job={job} masked={!accepted} />
            </section>
            <section>
              <SectionTitle>Estimated service fee</SectionTitle>
              <Card className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                    <IndianRupee className="size-4 text-success" /> Visit &amp; labour
                  </span>
                  <span className="num font-bold">{inr(LABOUR_RATE[job.appliance])}</span>
                </div>
                {job.estFee > LABOUR_RATE[job.appliance] && (
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink-2">Emergency surcharge</span>
                    <span className="num font-bold">{inr(job.estFee - LABOUR_RATE[job.appliance])}</span>
                  </div>
                )}
                <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-3">
                  <Label>You earn (before parts)</Label>
                  <span className="num text-xl font-extrabold text-success">{inr(job.estFee)}</span>
                </div>
                <p className="mt-2 text-xs text-muted">Parts are billed separately after diagnosis and customer approval.</p>
              </Card>
            </section>
          </div>
        </div>

        {job.status === 'request' && (
          <ActionDock>
            <button type="button" onClick={() => reject(job.id)} className="h-14 flex-1 rounded-xl border-2 border-line-strong text-[15px] font-extrabold text-ink-2 hover:border-danger hover:text-danger">
              REJECT JOB
            </button>
            <button type="button" onClick={() => accept(job.id)} className="h-14 flex-[1.6] rounded-xl bg-success text-[15px] font-extrabold text-white hover:brightness-95">
              ACCEPT JOB
            </button>
          </ActionDock>
        )}
      </Page>
    </>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-3">
      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-faint">
        <span className="text-brand">{icon}</span>
        {label}
      </dt>
      <dd className="num mt-0.5 text-base font-extrabold">{value}</dd>
    </div>
  )
}
