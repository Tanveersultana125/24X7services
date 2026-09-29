'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { Check, CircleCheck, Receipt, Star, TriangleAlert } from 'lucide-react'
import { JobNotFound, useJobParam } from '@/components/JobParts'
import { SignaturePad } from '@/components/SignaturePad'
import { ActionDock, Card, Label, Page, ScreenHeader, SectionTitle, inputClass } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { billTotal } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Job } from '@/lib/types'

export default function ConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  )
}

function Confirm() {
  const job = useJobParam()
  if (!job) return <JobNotFound />
  if (job.status === 'closed') return <Closed job={job} />
  return <ConfirmForm key={job.id} job={job} />
}

const TAGS = ['On time', 'Explained the problem', 'Clean work', 'Polite', 'Fair price']

function ConfirmForm({ job }: { job: Job }) {
  const store = useStore()
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState(job.confirmation?.signature ?? '')
  const [rating, setRating] = useState(job.confirmation?.rating ?? 0)
  const [review, setReview] = useState(job.confirmation?.review ?? '')
  const [tags, setTags] = useState<string[]>([])

  const paid = !!job.bill?.paid
  const ready = agreed && !!signature && rating > 0 && paid && job.status === 'confirmation'
  const missing = [!paid && 'payment', !agreed && 'confirmation', !signature && 'signature', !rating && 'rating'].filter(Boolean) as string[]

  return (
    <>
      <ScreenHeader back={stepHref('detail', job.id)} title="Customer confirmation" subtitle={`${job.id} · hand the phone to ${job.customer.name.split(' ')[0]}`} />
      <Page className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <section>
              <SectionTitle>Repair summary</SectionTitle>
              <Card className="p-4">
                <p className="text-lg font-extrabold tracking-tight">{applianceTitle(job.brand, job.appliance)}</p>
                <p className="text-sm font-semibold text-muted">Reported: “{job.issue}”</p>
                <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                  <div>
                    <Label>Problem found</Label>
                    <dd className="mt-0.5 font-bold">{job.diagnosis?.problem ?? '—'}</dd>
                  </div>
                  <div>
                    <Label>Work done</Label>
                    <dd className="mt-0.5 font-semibold text-ink-2">{job.diagnosis?.repair ?? '—'}</dd>
                  </div>
                  {job.parts.length > 0 && (
                    <div>
                      <Label>Parts replaced</Label>
                      <dd className="mt-0.5 font-semibold text-ink-2">{job.parts.map((p) => `${p.name} ×${p.qty}`).join(', ')}</dd>
                    </div>
                  )}
                  <div>
                    <Label>Service warranty</Label>
                    <dd className="mt-0.5 font-semibold text-ink-2">30 days on labour · parts as per manufacturer</dd>
                  </div>
                </dl>
              </Card>
            </section>

            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-muted">Total amount</p>
                <p className="num text-2xl font-extrabold tracking-tight">{inr(billTotal(job))}</p>
              </div>
              {paid ? (
                <span className="flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-sm font-extrabold text-success">
                  <CircleCheck className="size-4" /> Paid · {job.bill?.method === 'cash' ? 'Cash' : 'Online'}
                </span>
              ) : (
                <Link href={stepHref('bill', job.id)} className="flex items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-sm font-extrabold text-warning">
                  <Receipt className="size-4" /> Payment pending
                </Link>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <label className={cn('flex cursor-pointer items-start gap-3 rounded-card border-2 p-4 transition-colors', agreed ? 'border-success bg-success-soft' : 'border-line-strong bg-card')}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
              <span className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2', agreed ? 'border-success bg-success text-white' : 'border-line-strong bg-card')}>
                {agreed && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className="text-sm font-semibold text-ink-2">
                I confirm my {applianceTitle(job.brand, job.appliance)} was repaired and tested in front of me, and I agree with the amount above.
              </span>
            </label>

            <section>
              <SectionTitle>Customer signature</SectionTitle>
              <SignaturePad value={signature} onChange={setSignature} />
            </section>

            <section>
              <SectionTitle>Rate the service</SectionTitle>
              <Card className="p-4">
                <div className="flex justify-center gap-2" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="grid size-12 place-items-center">
                      <Star className={cn('size-9 transition-colors', n <= rating ? 'fill-warning text-warning' : 'text-line-strong')} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
                <p className="mt-1 h-5 text-center text-sm font-bold text-muted">{['', 'Poor', 'Below average', 'Okay', 'Good', 'Excellent'][rating]}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {TAGS.map((t) => {
                    const on = tags.includes(t)
                    return (
                      <button key={t} type="button" aria-pressed={on} onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))} className={cn('h-9 rounded-pill border px-3 text-xs font-bold', on ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong text-ink-2')}>
                        {t}
                      </button>
                    )
                  })}
                </div>
                <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2} placeholder="Anything else? (optional)" className={cn(inputClass, 'mt-3 resize-none text-sm')} />
              </Card>
            </section>
          </div>
        </div>

        <ActionDock>
          <div className="flex w-full flex-col gap-2">
            {!ready && missing.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-warning">
                <TriangleAlert className="size-3.5" /> Needed to close: {missing.join(', ')}
              </p>
            )}
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                const text = [tags.join(' · '), review.trim()].filter(Boolean).join(' — ')
                store.confirm(job.id, { signature, rating, review: text, at: new Date().toISOString() })
                store.advance(job.id, 'closed')
              }}
              className="h-14 w-full rounded-xl bg-success text-base font-extrabold text-white hover:brightness-95 disabled:bg-line-strong disabled:text-muted"
            >
              Close Job
            </button>
          </div>
        </ActionDock>
      </Page>
    </>
  )
}

function Closed({ job }: { job: Job }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5 pb-24">
      <div className="animate-slide-up w-full max-w-sm text-center">
        <div className="relative mx-auto grid size-24 place-items-center">
          <span className="animate-pulse-ring absolute inset-3 rounded-full bg-success/30" />
          <span className="relative grid size-20 place-items-center rounded-full bg-success text-white">
            <Check className="size-10" strokeWidth={3} />
          </span>
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Job closed</h1>
        <p className="mt-1 text-sm font-medium text-muted">
          {job.id} · {applianceTitle(job.brand, job.appliance)}
        </p>
        <Card className="mt-6 divide-y divide-line text-left">
          <div className="flex justify-between p-4">
            <span className="text-sm font-semibold text-muted">Amount</span>
            <span className="num font-extrabold">{inr(billTotal(job))}</span>
          </div>
          <div className="flex justify-between p-4">
            <span className="text-sm font-semibold text-muted">Payment</span>
            <span className="font-extrabold text-success">{job.bill?.method === 'cash' ? 'Cash received' : 'Online received'}</span>
          </div>
          {job.confirmation && (
            <div className="flex justify-between p-4">
              <span className="text-sm font-semibold text-muted">Customer rating</span>
              <span className="flex items-center gap-1 font-extrabold">
                {job.confirmation.rating} <Star className="size-4 fill-warning text-warning" />
              </span>
            </div>
          )}
        </Card>
        <div className="mt-6 grid gap-2">
          <Link href="/home" className="flex h-14 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white">
            Back to today’s jobs
          </Link>
          <Link href={stepHref('bill', job.id)} className="flex h-12 items-center justify-center rounded-xl text-sm font-bold text-brand">
            View service bill
          </Link>
        </div>
      </div>
    </div>
  )
}
