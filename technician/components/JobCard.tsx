'use client'

import Link from 'next/link'
import { Clock, MapPin, Navigation, Timer } from 'lucide-react'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { duration, time } from '@/lib/format'
import { jobHref } from '@/lib/routes'
import { STATUS } from '@/lib/status'
import type { Job } from '@/lib/types'
import { ApplianceGlyph, BrandTag } from './glyphs'
import { PriorityBadge, StatusChip, toneRail } from './ui'

/**
 * A job, readable in the three seconds a technician gives it between two
 * other things: what, where, when — then everything else.
 *
 * The coloured rail on the left is the status, so a list of cards can be
 * scanned by colour before a single word is read.
 */
export function JobCard({ job, compact }: { job: Job; compact?: boolean }) {
  const emergency = job.priority === 'emergency'
  return (
    <Link
      href={jobHref(job)}
      className={cn(
        'group relative block overflow-hidden rounded-card border bg-card shadow-card transition-[border-color,box-shadow] hover:shadow-float',
        emergency && job.status === 'request' ? 'border-danger/40' : 'border-line hover:border-line-strong'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', toneRail(emergency && job.status === 'request' ? 'danger' : STATUS[job.status].tone))} />
      <div className="py-3.5 pl-4 pr-3.5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-xl',
              emergency ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'
            )}
          >
            <ApplianceGlyph appliance={job.appliance} className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <BrandTag brand={job.brand} />
              {job.priority !== 'normal' && <PriorityBadge priority={job.priority} className="h-5 px-1.5 text-[9.5px]" />}
              <span className="truncate text-[11px] font-semibold text-faint">{job.service}</span>
            </div>
            <h3 className="mt-1 truncate text-[15.5px] font-extrabold leading-snug tracking-tight">
              {applianceTitle(job.brand, job.appliance)}
            </h3>
            <p className="truncate text-sm font-medium text-ink-2">&ldquo;{job.issue}&rdquo;</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="num text-[15px] font-extrabold">{time(job.scheduledAt)}</p>
            <StatusChip status={job.status} />
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex items-center gap-x-3 border-t border-line pt-2.5 text-[12px] font-semibold text-muted">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                <span className="text-ink-2">{job.customer.name}</span> · {job.customer.area}
              </span>
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <Navigation className="size-3.5" aria-hidden />
              <span className="num">{job.distanceKm} km</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Timer className="size-3.5" aria-hidden />
              {duration(job.durationMin)}
            </span>
          </div>
        )}
        {compact && (
          <div className="mt-2 flex items-center gap-3 pl-14 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {duration(job.durationMin)}
            </span>
            <span className="num flex items-center gap-1">
              <Navigation className="size-3.5" aria-hidden /> {job.distanceKm} km
            </span>
            <span className="truncate">{job.customer.area}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
