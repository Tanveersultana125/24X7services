'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ChevronRight, Package } from 'lucide-react'
import { JobNotFound, useJobParam } from '@/components/JobParts'
import { PhotoSlots } from '@/components/PhotoSlots'
import { ActionDock, Card, Field, FilterChip, Page, ScreenHeader, SectionTitle, inputClass } from '@/components/ui'
import { CONDITIONS, FAULT_CATEGORIES, LABOUR_RATE, applianceTitle, inr, type Condition } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { partsTotal } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Job } from '@/lib/types'

export default function DiagnosisPage() {
  return (
    <Suspense>
      <Diagnosis />
    </Suspense>
  )
}

function Diagnosis() {
  const job = useJobParam()
  if (!job) return <JobNotFound />
  return <DiagnosisForm key={job.id} job={job} />
}

const CONDITION_TONE: Record<Condition, string> = {
  Good: 'border-success bg-success text-white',
  Fair: 'border-info bg-info text-white',
  Poor: 'border-warning bg-warning text-white',
  'Not working': 'border-danger bg-danger text-white',
}

function DiagnosisForm({ job }: { job: Job }) {
  const store = useStore()
  const router = useRouter()
  const d = job.diagnosis
  const [condition, setCondition] = useState<Condition>(d?.condition ?? 'Not working')
  const [problem, setProblem] = useState(d?.problem ?? '')
  const [category, setCategory] = useState(d?.category ?? '')
  const [repair, setRepair] = useState(d?.repair ?? '')
  const [notes, setNotes] = useState(d?.notes ?? '')
  const suggested = LABOUR_RATE[job.appliance] + partsTotal(job)
  const [estimate, setEstimate] = useState<string>(String(d?.estimate ?? suggested))
  const [saved, setSaved] = useState(false)

  const valid = problem.trim() && category && repair.trim()
  const readOnly = job.status === 'closed'

  function save() {
    store.saveDiagnosis(job.id, {
      condition,
      problem: problem.trim(),
      category,
      repair: repair.trim(),
      notes: notes.trim(),
      estimate: Number(estimate) || suggested,
    })
  }

  return (
    <>
      <ScreenHeader back={stepHref('detail', job.id)} title="Diagnosis" subtitle={`${applianceTitle(job.brand, job.appliance)} · ${job.id}`} />
      <Page className="space-y-5">
        <fieldset disabled={readOnly} className="space-y-5">
          <Card className="space-y-5 p-4">
            <div>
              <p className="mb-2 text-sm font-bold text-ink-2">Appliance condition</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={condition === c}
                    onClick={() => setCondition(c)}
                    className={cn('h-11 rounded-xl border-2 text-sm font-extrabold transition-colors', condition === c ? CONDITION_TONE[c] : 'border-line-strong bg-card text-ink-2')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Problem identified">
              <input value={problem} onChange={(e) => setProblem(e.target.value)} className={inputClass} placeholder="e.g. Drain pump impeller jammed with debris" />
            </Field>

            <div>
              <p className="mb-2 text-sm font-bold text-ink-2">Fault category</p>
              <div className="flex flex-wrap gap-2">
                {FAULT_CATEGORIES[job.appliance].map((c) => (
                  <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                    {c}
                  </FilterChip>
                ))}
              </div>
            </div>

            <Field label="Required repair">
              <textarea value={repair} onChange={(e) => setRepair(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} placeholder="What you will do to fix it" />
            </Field>
          </Card>

          <section>
            <SectionTitle>Parts required</SectionTitle>
            <Link href={stepHref('parts', job.id)} onClick={() => valid && !readOnly && save()} className="flex items-center gap-3 rounded-card border border-line bg-card p-4 shadow-card hover:border-line-strong">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Package className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">{job.parts.length ? `${job.parts.length} part${job.parts.length > 1 ? 's' : ''} selected` : 'No parts selected'}</span>
                <span className="block truncate text-xs font-medium text-muted">
                  {job.parts.length ? job.parts.map((p) => `${p.name} ×${p.qty}`).join(', ') : 'Pick from van stock for this appliance'}
                </span>
              </span>
              <span className="num text-sm font-extrabold">{inr(partsTotal(job))}</span>
              <ChevronRight className="size-4 text-faint" />
            </Link>
          </section>

          <Card className="space-y-4 p-4">
            <Field label="Estimated repair cost" hint={`Suggested ${inr(suggested)} — labour ${inr(LABOUR_RATE[job.appliance])} + parts ${inr(partsTotal(job))}`}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span>
                <input inputMode="numeric" value={estimate} onChange={(e) => setEstimate(e.target.value.replace(/\D/g, ''))} className={cn(inputClass, 'num pl-8 font-extrabold')} />
              </div>
            </Field>
            <Field label="Technician notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} placeholder="Readings, advice given to the customer, anything the next technician should know" />
            </Field>
          </Card>
        </fieldset>

        <section id="photos" className="scroll-mt-20">
          <SectionTitle>Photos</SectionTitle>
          <Card className="p-4">
            <PhotoSlots job={job} />
          </Card>
        </section>

        {!readOnly && (
          <ActionDock>
            <button
              type="button"
              disabled={!valid}
              onClick={() => {
                save()
                setSaved(true)
                setTimeout(() => setSaved(false), 1600)
              }}
              className="h-14 flex-1 rounded-xl border-2 border-line-strong bg-card text-[15px] font-extrabold disabled:text-faint"
            >
              {saved ? 'Saved ✓' : 'Save'}
            </button>
            {job.status === 'diagnosis' && (
              <button
                type="button"
                disabled={!valid}
                onClick={() => {
                  save()
                  store.advance(job.id, 'repair')
                  router.push(stepHref('detail', job.id))
                }}
                className="h-14 flex-[1.6] rounded-xl bg-brand text-[15px] font-extrabold text-white hover:bg-brand-deep disabled:bg-line-strong disabled:text-muted"
              >
                Save &amp; Start Repair
              </button>
            )}
          </ActionDock>
        )}
      </Page>
    </>
  )
}
