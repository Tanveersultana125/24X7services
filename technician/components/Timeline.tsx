import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { time } from '@/lib/format'
import { STEP_LABEL, stepIndex } from '@/lib/status'
import { FLOW, type Job } from '@/lib/types'

/** The nine steps of a job, with the time each one happened. */
export function Timeline({ job }: { job: Job }) {
  const current = job.status === 'closed' ? FLOW.length : stepIndex(job.status)
  return (
    <ol className="relative">
      {FLOW.map((step, i) => {
        const done = i < current || (job.status === 'closed' && i === FLOW.length - 1)
        const now = i === current
        const at = job.log[step]
        return (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className={cn('absolute left-[11px] top-6 h-[calc(100%-20px)] w-0.5', done ? 'bg-success' : 'bg-line')} aria-hidden />
            )}
            <span
              className={cn(
                'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-extrabold',
                done && 'border-success bg-success text-white',
                now && 'border-brand bg-card text-brand',
                !done && !now && 'border-line-strong bg-card text-faint'
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              {now && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-brand/30" />}
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-0.5">
              <span className={cn('text-sm', done ? 'font-bold text-ink' : now ? 'font-extrabold text-brand' : 'font-semibold text-faint')}>
                {STEP_LABEL[step]}
                {now && <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wider text-brand/70">· current</span>}
              </span>
              {at && <span className="num shrink-0 text-xs font-semibold text-muted">{time(at)}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** The same nine steps as a thin progress bar, for cards and headers. */
export function FlowBar({ job, className }: { job: Job; className?: string }) {
  const current = job.status === 'closed' ? FLOW.length : stepIndex(job.status)
  return (
    <div className={cn('flex gap-1', className)} aria-label={`Step ${Math.max(current, 0) + 1} of ${FLOW.length}`}>
      {FLOW.map((s, i) => (
        <span key={s} className={cn('h-1.5 flex-1 rounded-full', i < current ? 'bg-success' : i === current ? 'bg-brand' : 'bg-line')} />
      ))}
    </div>
  )
}
