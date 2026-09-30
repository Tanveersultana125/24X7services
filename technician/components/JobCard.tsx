'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, IndianRupee, MapPin, Navigation, Package, Phone, Siren, Star, Stethoscope, TriangleAlert, UserRound } from 'lucide-react'
import { APPLIANCE_LABEL, BRAND_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, billTotal, dayLabel, directionsHref, driveProgress, earned, telHref, time } from '@/lib/format'
import { jobHref, stepHref } from '@/lib/routes'
import { IN_PROGRESS, STEP_LABEL } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { FlowStep, Job } from '@/lib/types'
import { ApplianceGlyph } from './glyphs'
import { ServiceMap } from './ServiceMap'

/**
 * A field job card. Every variant reads in the same order — status, what,
 * the problem, who, where, when, money, action — so a technician scanning a
 * list never has to hunt: the eye lands in the same place on every card.
 *
 * The card body opens the job; the action row holds the one or two things
 * the current status calls for, primary on the right, under the thumb.
 */

export type CardVariant = 'request' | 'emergency' | 'accepted' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled'

export function variantOf(job: Job): CardVariant {
  if (job.status === 'request') return job.priority === 'emergency' ? 'emergency' : 'request'
  if (job.status === 'assigned' || job.status === 'accepted') return 'accepted'
  if (job.status === 'on_the_way') return 'on_the_way'
  if (IN_PROGRESS.includes(job.status)) return 'in_progress'
  if (job.status === 'closed') return 'completed'
  return 'cancelled'
}

const BADGE: Record<CardVariant, { label: string; className: string }> = {
  request: { label: 'New request', className: 'bg-brand text-white' },
  emergency: { label: '24×7 Emergency', className: 'bg-danger text-white' },
  accepted: { label: 'Accepted', className: 'bg-brand-soft text-brand' },
  on_the_way: { label: 'On the way', className: 'bg-info-soft text-info' },
  in_progress: { label: 'In progress', className: 'bg-violet-soft text-violet' },
  completed: { label: 'Completed', className: 'bg-success-soft text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-canvas text-muted' },
}

function when(iso: string): string {
  return `${dayLabel(iso)} • ${time(iso)}`
}

export function JobCard({ job }: { job: Job }) {
  const variant = variantOf(job)
  const emergency = variant === 'emergency'
  const now = useTick(10_000)
  const badge =
    job.status === 'assigned' ? { label: 'Assigned', className: 'bg-warning-soft text-warning' } : BADGE[variant]

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-float',
        emergency ? 'border-danger/50 ring-1 ring-danger/15' : 'border-line',
        variant === 'cancelled' && 'opacity-75'
      )}
    >
      {emergency && (
        <div className="flex items-center justify-between gap-2 bg-danger px-4 py-2 text-white sm:px-5">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
            <Siren className="size-4" aria-hidden /> Respond now
          </span>
          <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider">
            <TriangleAlert className="size-3.5" aria-hidden /> Priority: High
          </span>
        </div>
      )}

      <Link href={jobHref(job)} className="block p-4 sm:p-5">
        {/* 1 — status */}
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-flex h-6 shrink-0 items-center rounded-md px-2 text-[10.5px] font-extrabold uppercase tracking-wider', badge.className)}>
            {badge.label}
          </span>
          {variant === 'request' && job.priority === 'high' && (
            <span className="inline-flex h-6 shrink-0 items-center rounded-md bg-warning px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-white">
              Urgent • 24×7
            </span>
          )}
          {variant === 'request' && job.priority === 'normal' && (
            <span className="inline-flex h-6 shrink-0 items-center rounded-md bg-canvas px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
              Normal
            </span>
          )}
          {variant === 'in_progress' && <span className="truncate text-[11.5px] font-bold text-violet">{STEP_LABEL[job.status as FlowStep]}</span>}
          <span className="num ml-auto shrink-0 text-[11px] font-semibold text-faint">{job.id}</span>
        </div>

        {/* 2 — brand + appliance */}
        <div className="mt-3 flex items-center gap-3">
          <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', emergency ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand')}>
            <ApplianceGlyph appliance={job.appliance} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">{BRAND_LABEL[job.brand]}</p>
            <h3 className="truncate text-[17px] font-extrabold leading-tight tracking-tight">{APPLIANCE_LABEL[job.appliance]}</h3>
          </div>
        </div>

        {/* 3 — the problem, or the work done */}
        <p className={cn('mt-3 text-[15px] font-semibold leading-snug', emergency ? 'text-danger' : 'text-ink')}>
          {variant === 'completed' ? (job.diagnosis?.repair ?? `${job.service} — ${job.issue}`) : <>&ldquo;{job.issue}&rdquo;</>}
        </p>

        {/* 4–7 — who, where, when, money */}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl bg-canvas px-3.5 py-3 text-[13px]">
          <Fact icon={UserRound} label="Customer" value={job.customer.name} />
          {variant === 'completed' || variant === 'cancelled' ? (
            <Fact icon={MapPin} label="Area" value={job.customer.area} />
          ) : (
            <Fact icon={MapPin} label="Location" value={`${job.distanceKm} km away`} />
          )}
          <VariantFacts job={job} variant={variant} now={now} />
        </dl>

        {variant === 'on_the_way' && (
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <ServiceMap
              aspect={16 / 7}
              to={job.customer}
              progress={driveProgress(job, now)}
              pins={[{ id: job.id, lat: job.customer.lat, lng: job.customer.lng, tone: 'danger' }]}
            />
          </div>
        )}
      </Link>

      <Actions job={job} variant={variant} />
    </article>
  )
}

function Fact({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-faint">
        <Icon className="size-3" aria-hidden /> {label}
      </dt>
      <dd className={cn('num mt-0.5 truncate font-bold text-ink', tone)}>{value}</dd>
    </div>
  )
}

function VariantFacts({ job, variant, now }: { job: Job; variant: CardVariant; now: number }) {
  switch (variant) {
    case 'emergency': {
      const fresh = now - new Date(job.requestedAt).getTime() < 5 * 60_000
      return (
        <>
          <Fact icon={Clock} label="Requested" value={fresh ? 'Now' : ago(job.requestedAt)} tone="text-danger" />
          <Fact icon={IndianRupee} label="Est. service" value={inr(job.estFee)} />
        </>
      )
    }
    case 'request':
      return (
        <>
          <Fact icon={Clock} label="Appointment" value={when(job.scheduledAt)} />
          <Fact icon={IndianRupee} label="Est. service" value={inr(job.estFee)} />
        </>
      )
    case 'accepted':
      return (
        <>
          <Fact icon={Clock} label="Appointment" value={when(job.scheduledAt)} />
          <Fact icon={Navigation} label="ETA" value={`${job.etaMin} min`} />
        </>
      )
    case 'on_the_way': {
      const left = Math.max(1, Math.round(job.etaMin * (1 - driveProgress(job, now))))
      return (
        <>
          <Fact icon={Navigation} label="ETA" value={`${left} minutes`} tone="text-info" />
          <Fact icon={Clock} label="Appointment" value={time(job.scheduledAt)} />
        </>
      )
    }
    case 'in_progress':
      return (
        <>
          <Fact icon={Stethoscope} label="Diagnosis" value={job.diagnosis?.problem ?? 'Not recorded yet'} tone={job.diagnosis ? undefined : 'text-warning'} />
          <Fact icon={Package} label="Parts" value={job.parts.length ? 'Required' : 'Not required'} />
          <Fact icon={IndianRupee} label="Service amount" value={inr(job.diagnosis?.estimate ?? billTotal(job))} />
        </>
      )
    case 'completed':
      return (
        <>
          <Fact icon={Clock} label="Completed" value={when(job.log.closed ?? job.scheduledAt)} />
          <Fact
            icon={IndianRupee}
            label="Payment"
            value={
              <>
                {inr(earned(job))} <span className="text-success">• PAID</span>
              </>
            }
          />
          {job.confirmation?.rating ? (
            <div className="col-span-2 flex items-center gap-0.5" aria-label={`Rated ${job.confirmation.rating} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn('size-4', n <= job.confirmation!.rating ? 'fill-warning text-warning' : 'text-line-strong')} aria-hidden />
              ))}
            </div>
          ) : null}
        </>
      )
    default:
      return <Fact icon={Clock} label="Was due" value={when(job.scheduledAt)} />
  }
}

const primary =
  'flex h-12 min-w-0 flex-[1.4] items-center justify-center gap-2 rounded-xl px-3 text-[14.5px] font-extrabold text-white transition-[filter,background-color]'
const secondary =
  'flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-line-strong bg-card px-3 text-[14px] font-extrabold text-ink-2 hover:border-ink-2'

function Actions({ job, variant }: { job: Job; variant: CardVariant }) {
  const { accept, advance } = useStore()
  const router = useRouter()
  if (variant === 'cancelled') return null

  const directions = directionsHref(job.customer.lat, job.customer.lng)
  let row: React.ReactNode

  switch (variant) {
    case 'emergency':
      row = (
        <>
          <a href={directions} target="_blank" rel="noreferrer" className={secondary}>
            <Navigation className="size-4" aria-hidden /> Navigate
          </a>
          <button
            type="button"
            onClick={() => {
              accept(job.id)
              router.push(stepHref('detail', job.id))
            }}
            className={cn(primary, 'bg-danger hover:brightness-95')}
          >
            Accept emergency
          </button>
        </>
      )
      break
    case 'request':
      row = (
        <>
          <Link href={jobHref(job)} className={secondary}>
            View details
          </Link>
          <button type="button" onClick={() => accept(job.id)} className={cn(primary, 'bg-success hover:brightness-95')}>
            Accept job
          </button>
        </>
      )
      break
    case 'accepted':
      row =
        job.status === 'assigned' ? (
          <>
            <Link href={stepHref('detail', job.id)} className={secondary}>
              View job
            </Link>
            <button type="button" onClick={() => accept(job.id)} className={cn(primary, 'bg-success hover:brightness-95')}>
              Accept job
            </button>
          </>
        ) : (
          <>
            <Link href={stepHref('detail', job.id)} className={secondary}>
              View job
            </Link>
            {/* Setting off is the moment the job goes On the way. */}
            <a href={directions} target="_blank" rel="noreferrer" onClick={() => advance(job.id, 'on_the_way')} className={cn(primary, 'bg-brand hover:bg-brand-deep')}>
              <Navigation className="size-4" aria-hidden /> Navigate
            </a>
          </>
        )
      break
    case 'on_the_way':
      row = (
        <>
          <a href={telHref(job.customer.phone)} className={secondary}>
            <Phone className="size-4" aria-hidden /> Call
          </a>
          <a href={directions} target="_blank" rel="noreferrer" className={cn(primary, 'bg-brand hover:bg-brand-deep')}>
            <Navigation className="size-4" aria-hidden /> Open navigation
          </a>
        </>
      )
      break
    case 'in_progress':
      row = (
        <>
          <Link href={stepHref('diagnosis', job.id)} className={secondary}>
            Update diagnosis
          </Link>
          <Link href={stepHref('detail', job.id)} className={cn(primary, 'bg-brand hover:bg-brand-deep')}>
            Continue service
          </Link>
        </>
      )
      break
    case 'completed':
      row = (
        <>
          <Link href={stepHref('detail', job.id)} className={secondary}>
            View details
          </Link>
          <Link href={stepHref('bill', job.id)} className={cn(primary, 'bg-ink hover:bg-ink-2')}>
            View invoice
          </Link>
        </>
      )
      break
  }
  return <div className="flex gap-2.5 border-t border-line px-4 py-3 sm:px-5">{row}</div>
}
