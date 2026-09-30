'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import { ArrowRight, Check, ChevronRight, MessageSquareText, PhoneCall } from 'lucide-react'
import { AiMark, CallMark } from '@/components/ai/AiMark'
import { ApplianceGlyph } from '@/components/glyphs'
import { Card, Empty, Page, ScreenHeader, SectionTitle, Sheet, StatusChip } from '@/components/ui'
import { PURPOSE_LABEL, RESULT_LABEL } from '@/lib/ai/call'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dayLabel, time } from '@/lib/format'
import type { Job } from '@/lib/types'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'

const CHAT_POINTS = ['Diagnose problems', 'Troubleshoot appliances', 'Find possible parts', 'Generate service notes']
const CALL_POINTS = ['Confirm appointments', 'Share ETA', 'Collect customer information', 'Follow-up calls']

export default function AiAssistPage() {
  const { jobs, aiThreads, aiCalls } = useStore()
  const [pick, setPick] = useState<null | 'chat' | 'call'>(null)
  // Today's open work first; then the last few finished jobs, which only
  // matter here for a follow-up call or notes.
  const active = jobs.filter((j) => !['request', 'cancelled', 'rejected', 'closed'].includes(j.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const recent = jobs
    .filter((j) => j.status === 'closed')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 4)

  const activity = [
    ...aiThreads.map((t) => ({ kind: 'chat' as const, id: t.id, at: t.updatedAt, jobId: t.jobId, title: t.title, sub: `${t.messages.filter((m) => m.role === 'tech').length} questions` })),
    ...aiCalls.map((c) => ({ kind: 'call' as const, id: c.id, at: c.at, jobId: c.jobId, title: PURPOSE_LABEL[c.purpose], sub: RESULT_LABEL[c.result] })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)

  return (
    <>
      <ScreenHeader back="/home" title="AI Assist" subtitle="Technical help and customer calls" />
      <Page className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <AgentCard
            mark={<AiMark size={48} />}
            eyebrow="AI Chat Agent"
            title="Technical Assistance"
            points={CHAT_POINTS}
            cta="Open Chat"
            ctaClass="bg-brand-ink hover:bg-brand"
            href={'/ai/chat' as Route}
            secondary={{ label: 'Ask about a job', onClick: () => setPick('chat') }}
          />
          <AgentCard
            mark={<CallMark size={48} />}
            eyebrow="AI Call Agent"
            title="Customer Communication"
            points={CALL_POINTS}
            cta="Start Call"
            ctaClass="bg-success hover:brightness-95"
            onClick={() => setPick('call')}
          />
        </div>

        <section>
          <SectionTitle count={activity.length}>Recent AI activity</SectionTitle>
          {activity.length === 0 ? (
            <Card className="p-2">
              <Empty icon={<AiMark size={20} className="bg-transparent text-brand" />} title="No AI activity yet" body="Conversations and call summaries you save appear here and under each job." />
            </Card>
          ) : (
            <Card className="divide-y divide-line">
              {activity.map((a) => {
                const job = jobs.find((j) => j.id === a.jobId)
                const href = (a.kind === 'chat' ? `/ai/chat/?${job ? `id=${job.id}&` : ''}t=${a.id}` : job ? stepHref('detail', job.id) : '/ai') as Route
                return (
                  <Link key={a.id} href={href} className="flex items-center gap-3 p-3.5 hover:bg-canvas">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', a.kind === 'chat' ? 'bg-brand-soft text-brand' : 'bg-success-soft text-success')}>
                      {a.kind === 'chat' ? <MessageSquareText className="size-5" /> : <PhoneCall className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{a.title}</span>
                      <span className="block truncate text-xs font-medium text-muted">
                        {job ? `${applianceTitle(job.brand, job.appliance)} · ${job.id}` : 'General'} · {a.sub}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[11px] font-semibold text-faint">{ago(a.at)}</span>
                  </Link>
                )
              })}
            </Card>
          )}
        </section>
      </Page>

      <Sheet open={pick !== null} onClose={() => setPick(null)} title={pick === 'call' ? 'Which job is the call about?' : 'Which job is this about?'}>
        {active.length === 0 && recent.length === 0 ? (
          <p className="text-sm text-muted">No jobs to pick from right now.</p>
        ) : (
          <div className="-mx-4 -my-4">
            <PickGroup title="Active jobs" hint={pick === 'call' ? 'Confirm, ETA, reschedule' : undefined} jobs={active} kind={pick} />
            <PickGroup title="Recently completed" hint={pick === 'call' ? 'For follow-up calls' : undefined} jobs={recent} kind={pick} />
          </div>
        )}
      </Sheet>
    </>
  )
}

function AgentCard({
  mark,
  eyebrow,
  title,
  points,
  cta,
  ctaClass,
  href,
  onClick,
  secondary,
}: {
  mark: React.ReactNode
  eyebrow: string
  title: string
  points: string[]
  cta: string
  ctaClass: string
  href?: Route
  onClick?: () => void
  secondary?: { label: string; onClick: () => void }
}) {
  const button = cn('flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-extrabold uppercase tracking-wide text-white transition', ctaClass)
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3.5">
        {mark}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-faint">{eyebrow}</p>
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
        </div>
      </div>
      <ul className="mt-4 flex-1 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm font-semibold text-ink-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-canvas text-success">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2">
        {href ? (
          <Link href={href} className={button}>
            {cta} <ArrowRight className="size-4" />
          </Link>
        ) : (
          <button type="button" onClick={onClick} className={button}>
            {cta} <ArrowRight className="size-4" />
          </button>
        )}
        {secondary && (
          <button type="button" onClick={secondary.onClick} className="h-12 shrink-0 rounded-xl border-2 border-line-strong px-3.5 text-[13px] font-extrabold text-ink-2 hover:border-ink-2">
            {secondary.label}
          </button>
        )}
      </div>
    </Card>
  )
}

function PickGroup({ title, hint, jobs, kind }: { title: string; hint?: string; jobs: Job[]; kind: 'chat' | 'call' | null }) {
  if (jobs.length === 0) return null
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-line bg-canvas px-4 py-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
          {title} <span className="num text-faint">· {jobs.length}</span>
        </p>
        {hint && <p className="text-[11px] font-semibold text-faint">{hint}</p>}
      </div>
      <ul className="divide-y divide-line">
        {jobs.map((j) => {
          const done = j.status === 'closed'
          return (
            <li key={j.id}>
              <Link href={(kind === 'call' ? `/ai/call/?id=${j.id}` : `/ai/chat/?id=${j.id}`) as Route} className="flex items-start gap-3 px-4 py-3.5 hover:bg-canvas active:bg-canvas">
                <span className={cn('mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl', done ? 'bg-canvas text-faint' : 'bg-brand-soft text-brand')}>
                  <ApplianceGlyph appliance={j.appliance} className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-extrabold leading-snug">{applianceTitle(j.brand, j.appliance)}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <StatusChip status={j.status} className="shrink-0" />
                    <span className="num truncate text-[12px] font-bold text-ink-2">
                      {dayLabel(j.scheduledAt)}, {time(j.scheduledAt)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[12.5px] font-medium text-muted">
                    <span className="font-semibold text-ink-2">{j.customer.name}</span> · “{j.issue}”
                  </span>
                </span>
                <ChevronRight className="mt-3.5 size-4 shrink-0 text-faint" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
