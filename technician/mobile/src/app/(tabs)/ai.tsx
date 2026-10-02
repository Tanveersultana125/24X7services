import { useState } from 'react'
import { View } from 'react-native'
import type { Href } from 'expo-router'
import { ArrowRight, Check, ChevronRight, MessageSquareText, PhoneCall } from 'lucide-react-native'
import { AiMark, CallMark } from '@/components/ai/AiMark'
import { ConfirmDelete, DeleteKey } from '@/components/ai/DeleteAi'
import { ApplianceGlyph } from '@/components/glyphs'
import { Card, Empty, Icon, Page, ScreenHeader, SectionTitle, Sheet, StatusChip, Tappable, Text } from '@/components/ui'
import { PURPOSE_LABEL, RESULT_LABEL } from '@/lib/ai/call'
import { applianceTitle } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dayLabel, plural, time } from '@/lib/format'
import type { Job } from '@/lib/types'
import { stepHref } from '@/lib/routes'
import { useStore } from '@/lib/store'

const CHAT_POINTS = ['Diagnose problems', 'Troubleshoot appliances', 'Find possible parts', 'Generate service notes']
const CALL_POINTS = ['Confirm appointments', 'Share ETA', 'Collect customer information', 'Follow-up calls']

export default function AiAssistScreen() {
  const { jobs, aiThreads, aiCalls, deleteAi } = useStore()
  const [pick, setPick] = useState<null | 'chat' | 'call'>(null)
  const [doomed, setDoomed] = useState<null | 'all' | { kind: 'chat' | 'call'; id: string; title: string }>(null)
  // Today's open work first; then the last few finished jobs, which only
  // matter here for a follow-up call or notes.
  const active = jobs.filter((j) => !['request', 'cancelled', 'rejected', 'closed'].includes(j.status)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const recent = jobs
    .filter((j) => j.status === 'closed')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 4)

  const activity = [
    ...aiThreads.map((t) => ({ kind: 'chat' as const, id: t.id, at: t.updatedAt, jobId: t.jobId, title: t.title, sub: plural(t.messages.filter((m) => m.role === 'tech').length, 'question') })),
    ...aiCalls.map((c) => ({ kind: 'call' as const, id: c.id, at: c.at, jobId: c.jobId, title: PURPOSE_LABEL[c.purpose], sub: RESULT_LABEL[c.result] })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)

  return (
    <>
      <ScreenHeader back="/home" title="AI Assist" subtitle="Technical help and customer calls" />
      <Page className="gap-6">
        <View className="gap-4">
          <AgentCard
            mark={<AiMark size={48} />}
            eyebrow="AI Chat Agent"
            title="Technical Assistance"
            points={CHAT_POINTS}
            cta="Open Chat"
            ctaClass="bg-brand-ink active:bg-brand"
            href={'/ai/chat' as Href}
            secondary={{ label: 'Ask about a job', onClick: () => setPick('chat') }}
          />
          <AgentCard
            mark={<CallMark size={48} />}
            eyebrow="AI Call Agent"
            title="Customer Communication"
            points={CALL_POINTS}
            cta="Start Call"
            ctaClass="bg-success active:opacity-90"
            onClick={() => setPick('call')}
          />
        </View>

        <View>
          <SectionTitle
            count={aiThreads.length + aiCalls.length}
            action={
              activity.length > 0 && (
                <Tappable onPress={() => setDoomed('all')} hitSlop={8}>
                  <Text className="text-xs font-bold text-danger">Clear all</Text>
                </Tappable>
              )
            }
          >
            Recent AI activity
          </SectionTitle>
          {activity.length === 0 ? (
            <Card className="p-2">
              <Empty icon={<AiMark size={20} className="bg-transparent text-brand" />} title="No AI activity yet" body="Conversations and call summaries you save appear here and under each job." />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {activity.map((a, i) => {
                const job = jobs.find((j) => j.id === a.jobId)
                const href = (a.kind === 'chat' ? `/ai/chat?${job ? `id=${job.id}&` : ''}t=${a.id}` : job ? stepHref('detail', job.id) : '/ai') as Href
                return (
                  <View key={a.id} className={cn('flex-row items-center gap-1 pr-2', i > 0 && 'border-t border-line')}>
                    <Tappable href={href} className="min-w-0 flex-1 flex-row items-center gap-3 p-3.5 pr-1 active:bg-canvas active:opacity-100">
                      <View className={cn('size-10 shrink-0 items-center justify-center rounded-xl', a.kind === 'chat' ? 'bg-brand-soft' : 'bg-success-soft')}>
                        <Icon as={a.kind === 'chat' ? MessageSquareText : PhoneCall} className={cn('size-5', a.kind === 'chat' ? 'text-brand' : 'text-success')} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="text-sm font-extrabold">
                          {a.title}
                        </Text>
                        <Text numberOfLines={1} className="text-xs font-medium text-muted">
                          {job ? `${applianceTitle(job.brand, job.appliance)} · ${job.id}` : 'General'} · {a.sub}
                        </Text>
                      </View>
                      <Text className="num shrink-0 text-[11px] font-semibold text-faint">{ago(a.at)}</Text>
                    </Tappable>
                    <DeleteKey label={`Delete ${a.title}`} onClick={() => setDoomed({ kind: a.kind, id: a.id, title: a.title })} />
                  </View>
                )
              })}
            </Card>
          )}
        </View>
      </Page>

      <ConfirmDelete
        open={doomed !== null}
        title={doomed === 'all' ? 'Clear all AI activity?' : doomed?.kind === 'call' ? 'Delete call summary?' : 'Delete conversation?'}
        body={
          doomed === 'all'
            ? 'Every AI conversation and call summary on this phone will be removed, including those saved under jobs. Service notes already saved to a job stay.'
            : `“${doomed?.title ?? ''}” will be removed from this phone and from its job. This can’t be undone.`
        }
        onCancel={() => setDoomed(null)}
        onConfirm={() => {
          if (doomed === 'all') deleteAi({ threads: aiThreads.map((t) => t.id), calls: aiCalls.map((c) => c.id) })
          else if (doomed) deleteAi(doomed.kind === 'chat' ? { threads: [doomed.id] } : { calls: [doomed.id] })
          setDoomed(null)
        }}
      />

      <Sheet open={pick !== null} onClose={() => setPick(null)} title={pick === 'call' ? 'Which job is the call about?' : 'Which job is this about?'}>
        {active.length === 0 && recent.length === 0 ? (
          <Text className="text-sm text-muted">No jobs to pick from right now.</Text>
        ) : (
          <View className="-mx-4 -my-4">
            <PickGroup title="Active jobs" hint={pick === 'call' ? 'Confirm, ETA, reschedule' : undefined} jobs={active} kind={pick} onPicked={() => setPick(null)} />
            <PickGroup title="Recently completed" hint={pick === 'call' ? 'For follow-up calls' : undefined} jobs={recent} kind={pick} onPicked={() => setPick(null)} />
          </View>
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
  href?: Href
  onClick?: () => void
  secondary?: { label: string; onClick: () => void }
}) {
  return (
    <Card className="p-5">
      <View className="flex-row items-start gap-3.5">
        {mark}
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-faint">{eyebrow}</Text>
          <Text accessibilityRole="header" className="text-lg font-extrabold tracking-tight">
            {title}
          </Text>
        </View>
      </View>
      <View className="mt-4 gap-2">
        {points.map((p) => (
          <View key={p} className="flex-row items-center gap-2.5">
            <View className="size-5 shrink-0 items-center justify-center rounded-full bg-canvas">
              <Icon as={Check} className="size-3 text-success" strokeWidth={3} />
            </View>
            <Text className="min-w-0 flex-1 text-sm font-semibold text-ink-2">{p}</Text>
          </View>
        ))}
      </View>
      <View className="mt-5 flex-row gap-2">
        <Tappable
          href={href}
          onPress={href ? undefined : onClick}
          className={cn('h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl active:opacity-100', ctaClass)}
        >
          <Text className="text-[14px] font-extrabold uppercase tracking-wide text-white">{cta}</Text>
          <Icon as={ArrowRight} className="size-4 text-white" />
        </Tappable>
        {secondary && (
          <Tappable
            onPress={secondary.onClick}
            className="h-12 shrink-0 items-center justify-center rounded-xl border-2 border-line-strong px-3.5 active:border-ink-2 active:opacity-100"
          >
            <Text className="text-[13px] font-extrabold text-ink-2">{secondary.label}</Text>
          </Tappable>
        )}
      </View>
    </Card>
  )
}

function PickGroup({ title, hint, jobs, kind, onPicked }: { title: string; hint?: string; jobs: Job[]; kind: 'chat' | 'call' | null; onPicked: () => void }) {
  if (jobs.length === 0) return null
  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-3 border-b border-line bg-canvas px-4 py-2">
        <Text className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
          {title} <Text className="num text-[11px] font-extrabold text-faint">· {jobs.length}</Text>
        </Text>
        {hint ? <Text className="text-[11px] font-semibold text-faint">{hint}</Text> : null}
      </View>
      <View>
        {jobs.map((j, i) => {
          const done = j.status === 'closed'
          return (
            <Tappable
              key={j.id}
              href={(kind === 'call' ? `/ai/call?id=${j.id}` : `/ai/chat?id=${j.id}`) as Href}
              // The sheet is a system modal: close it so it is not left over
              // the screen the link opens.
              onPress={onPicked}
              className={cn('flex-row items-start gap-3 px-4 py-3.5 active:bg-canvas active:opacity-100', i > 0 && 'border-t border-line')}
            >
              <View className={cn('mt-0.5 size-11 shrink-0 items-center justify-center rounded-xl', done ? 'bg-canvas' : 'bg-brand-soft')}>
                <ApplianceGlyph appliance={j.appliance} className={cn('size-6', done ? 'text-faint' : 'text-brand')} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-[14.5px] font-extrabold leading-snug">
                  {applianceTitle(j.brand, j.appliance)}
                </Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <StatusChip status={j.status} className="shrink-0" />
                  <Text numberOfLines={1} className="num min-w-0 flex-1 text-[12px] font-bold text-ink-2">
                    {dayLabel(j.scheduledAt)}, {time(j.scheduledAt)}
                  </Text>
                </View>
                <Text numberOfLines={1} className="mt-1 text-[12.5px] font-medium text-muted">
                  <Text className="text-[12.5px] font-semibold text-ink-2">{j.customer.name}</Text> · “{j.issue}”
                </Text>
              </View>
              <Icon as={ChevronRight} className="mt-3.5 size-4 shrink-0 text-faint" />
            </Tappable>
          )
        })}
      </View>
    </View>
  )
}
