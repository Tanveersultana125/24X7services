'use client'

import { useSearchParams } from 'next/navigation'
import { MapPin, MessageSquareText, Phone } from 'lucide-react'
import { ApplianceGlyph, BrandTag } from './glyphs'
import { Card, Empty, Label, PriorityBadge, StatusChip } from './ui'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { telHref } from '@/lib/format'
import { useJob } from '@/lib/store'
import type { Job } from '@/lib/types'
import { SearchX } from 'lucide-react'

/** The job a `?id=` screen is about, or a not-found panel. */
export function useJobParam(): Job | undefined {
  const id = useSearchParams().get('id')
  return useJob(id)
}

export function JobNotFound() {
  return (
    <div className="px-4 pt-10">
      <Empty icon={<SearchX className="size-5" />} title="Job not found" body="It may have been reassigned by dispatch or cleared from this device." />
    </div>
  )
}

/** Appliance, brand, service and issue — the same block on every job screen. */
export function JobSummary({ job, className }: { job: Job; className?: string }) {
  const emergency = job.priority === 'emergency'
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <div className={cn('grid size-14 shrink-0 place-items-center rounded-2xl', emergency ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
          <ApplianceGlyph appliance={job.appliance} className="size-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <BrandTag brand={job.brand} />
            <PriorityBadge priority={job.priority} />
            <StatusChip status={job.status} />
          </div>
          <h2 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight">{applianceTitle(job.brand, job.appliance)}</h2>
          <p className="text-[15px] font-semibold text-ink-2">&ldquo;{job.issue}&rdquo;</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
        <div>
          <Label>Service</Label>
          <dd className="mt-0.5 font-bold">{job.service}</dd>
        </div>
        <div>
          <Label>Model</Label>
          <dd className="mt-0.5 truncate font-bold">{job.model ?? '—'}</dd>
        </div>
        <div>
          <Label>Job ID</Label>
          <dd className="num mt-0.5 font-bold">{job.id}</dd>
        </div>
        <div>
          <Label>Est. duration</Label>
          <dd className="mt-0.5 font-bold">{job.durationMin} min</dd>
        </div>
      </dl>
      {job.customerNote && (
        <div className="mt-4 flex gap-2.5 rounded-xl bg-warning-soft p-3 text-sm">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="font-medium text-ink-2">
            <span className="font-extrabold text-ink">Customer note: </span>
            {job.customerNote}
          </p>
        </div>
      )}
    </Card>
  )
}

export function CustomerBlock({ job, masked }: { job: Job; masked?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-canvas text-sm font-extrabold text-ink-2">
          {job.customer.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{job.customer.name}</p>
          <p className="num text-sm font-semibold text-muted">{masked ? job.customer.phone.replace(/\d(?=(?:\D*\d){4})/g, '•') : job.customer.phone}</p>
        </div>
        {!masked && (
          <a href={telHref(job.customer.phone)} aria-label="Call customer" className="grid size-11 place-items-center rounded-full bg-success-soft text-success hover:bg-success hover:text-white">
            <Phone className="size-5" />
          </a>
        )}
      </div>
      <div className="mt-3 flex gap-2.5 border-t border-line pt-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
        <div className="text-sm">
          <p className="font-semibold text-ink">{masked ? job.customer.area + ', Hyderabad' : job.customer.address}</p>
          {job.customer.landmark && !masked && <p className="text-muted">Landmark: {job.customer.landmark}</p>}
          {masked && <p className="text-xs text-muted">Full address and number unlock when you accept.</p>}
        </div>
      </div>
    </Card>
  )
}
