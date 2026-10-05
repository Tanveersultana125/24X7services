import { useState } from 'react'
import { Linking, View } from 'react-native'
import type { Href } from 'expo-router'
import {
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
  MessageSquareText,
  NotebookPen,
  Navigation,
  Package,
  PenLine,
  Phone,
  PhoneCall,
  Receipt,
  Stethoscope,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native'
import { AiMark, CallMark } from '@/components/ai/AiMark'
import { ConfirmDelete, DeleteKey } from '@/components/ai/DeleteAi'
import { CustomerBlock, JobNotFound, JobSummary, ServiceSummary, useJobParam } from '@/components/JobParts'
import { ServiceMap } from '@/components/ServiceMap'
import { FlowBar, Timeline } from '@/components/Timeline'
import { ActionDock, Button, Card, Icon, Inherit, Page, ScreenHeader, SectionTitle, Tappable, Text } from '@/components/ui'
import { applianceTitle, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, billTotal, directionsHref, driveProgress, plural, telHref, time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { PURPOSE_LABEL, RESULT_LABEL } from '@/lib/ai/call'
import { NEXT_ACTION, STATUS, stepIndex } from '@/lib/status'
import { useStore, useTick } from '@/lib/store'
import type { FlowStep, Job } from '@/lib/types'

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
function gate(job: Job): { href: Href; label: string } | null {
  if (job.status === 'diagnosis' && !job.diagnosis) return { href: stepHref('diagnosis', job.id), label: 'Record diagnosis' }
  if (job.status === 'repaired') return { href: stepHref('bill', job.id), label: 'Generate Bill' }
  if (job.status === 'confirmation') return { href: stepHref('confirm', job.id), label: 'Customer confirmation' }
  return null
}

export default function JobDetail() {
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

  // The web linked to the diagnosis screen's #photos anchor; here the screen
  // takes `focus=photos` and scrolls itself there.
  const tasks: { icon: LucideIcon; label: string; href: Href; done: boolean; detail: string; ready: boolean }[] = [
    { icon: Stethoscope, label: 'Diagnosis', href: stepHref('diagnosis', job.id), done: !!job.diagnosis, detail: job.diagnosis ? job.diagnosis.category : 'Condition, fault, required repair', ready: idx >= stepIndex('diagnosis') },
    { icon: Package, label: 'Parts', href: stepHref('parts', job.id), done: job.parts.length > 0, detail: job.parts.length ? `${job.parts.reduce((s, p) => s + p.qty, 0)} items selected` : 'Select from van stock', ready: idx >= stepIndex('diagnosis') },
    { icon: Camera, label: 'Photos', href: `/jobs/diagnosis?id=${job.id}&focus=photos` as Href, done: job.photos.length > 0, detail: job.photos.length ? `${job.photos.length} uploaded` : 'Appliance, damaged part, before / after', ready: onSite },
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
            <Tappable
              accessibilityLabel="Call customer"
              onPress={() => Linking.openURL(telHref(job.customer.phone))}
              className="size-11 items-center justify-center rounded-full bg-success-soft"
            >
              <Icon as={Phone} className="size-5 text-success" />
            </Tappable>
          )
        }
      />
      <Page className="gap-4">
        {cancelled ? (
          <View className="flex-row items-start gap-3 rounded-card border border-danger/30 bg-danger-soft p-4">
            <Icon as={TriangleAlert} className="mt-0.5 size-5 shrink-0 text-danger" />
            <View className="flex-1">
              <Text className="font-extrabold text-danger">{STATUS[job.status].label}</Text>
              <Text className="text-sm font-medium text-ink-2">{job.cancelReason ?? 'This job is no longer assigned to you.'}</Text>
            </View>
          </View>
        ) : (
          <Card className="p-4">
            <View className="mb-2 flex-row items-baseline justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-faint">Job progress</Text>
              <Text className="num text-xs font-bold text-muted">Step {Math.min(idx + 1, 9)} of 9</Text>
            </View>
            <FlowBar job={job} />
          </Card>
        )}

        {/* Location */}
        {!cancelled && job.status !== 'closed' && (
          <Card className="overflow-hidden">
            <ServiceMap
              to={job.customer}
              progress={progress}
              pins={[{ id: job.id, lat: job.customer.lat, lng: job.customer.lng, tone: 'danger', label: job.customer.name.split(' ')[0] }]}
            />
            <View className="flex-row items-center gap-3 p-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  {onSite ? 'At customer location' : job.status === 'on_the_way' ? 'Arriving in' : 'Drive time'}
                </Text>
                <Text className="num text-lg font-extrabold leading-tight">
                  {onSite ? 'Arrived ' + (job.log.arrived ? time(job.log.arrived) : '') : `${job.status === 'on_the_way' ? remaining : job.etaMin} min`}
                  {!onSite && <Text className="num text-sm font-bold text-muted">{`  · ${(job.distanceKm * (1 - progress)).toFixed(1)} km`}</Text>}
                </Text>
              </View>
              <Button className="h-12" textClassName="font-extrabold" onPress={() => Linking.openURL(directionsHref(job.customer.lat, job.customer.lng))}>
                <Icon as={Navigation} className="size-4" />
                Navigate
              </Button>
            </View>
          </Card>
        )}

        <JobSummary job={job} />

        {/* Status buttons */}
        {!cancelled && (
          <View>
            <SectionTitle>Update status</SectionTitle>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_BUTTONS.map((b) => {
                const target = b.to === 'closed' ? 99 : stepIndex(b.to)
                const done = target <= idx
                const isNext = next?.to === b.to || (b.to === 'closed' && job.status === 'confirmation')
                const blocked = isNext && !!g
                return (
                  <Tappable
                    key={b.to}
                    disabled={done || !isNext || blocked}
                    accessibilityState={{ disabled: done || !isNext || blocked }}
                    onPress={() => store.advance(job.id, b.to)}
                    className={cn(
                      'h-14 grow basis-[47%] flex-row items-center justify-center gap-1.5 rounded-xl border-2 px-2',
                      done && 'border-success/20 bg-success-soft',
                      isNext && !blocked && 'border-brand bg-brand active:bg-brand-deep active:opacity-100',
                      isNext && blocked && 'border-brand/40 bg-brand-soft',
                      !done && !isNext && 'border-line bg-card'
                    )}
                  >
                    <Inherit
                      className={cn(
                        'text-sm font-extrabold',
                        done && 'text-success',
                        isNext && !blocked && 'text-white',
                        isNext && blocked && 'text-brand',
                        !done && !isNext && 'text-faint'
                      )}
                    >
                      {done && <Icon as={Check} className="size-4" strokeWidth={3} />}
                      <Text>{b.label}</Text>
                    </Inherit>
                  </Tappable>
                )
              })}
            </View>
            {g && (
              <Text className="mt-2 text-xs font-semibold text-muted">
                {job.status === 'diagnosis' && 'Record the diagnosis before starting the repair.'}
                {job.status === 'repaired' && 'Generate the bill, then take the customer’s confirmation.'}
                {job.status === 'confirmation' && 'Collect the customer’s signature and payment to close the job.'}
              </Text>
            )}
          </View>
        )}

        {!cancelled && (
          <View>
            <SectionTitle>Customer</SectionTitle>
            <CustomerBlock job={job} />
            <View className="mt-2 flex-row gap-2">
              <QuickAction onPress={() => Linking.openURL(telHref(job.customer.phone))} icon={<Icon as={Phone} className="size-5 text-success" />} label="Call Customer" />
              <QuickAction onPress={() => Linking.openURL(`sms:${job.customer.phone.replace(/\s/g, '')}`)} icon={<Icon as={MessageCircle} className="size-5 text-brand" />} label="Chat Customer" />
              <QuickAction href={`/ai/chat?id=${job.id}` as Href} icon={<AiMark size={22} />} label="Ask AI" />
              <QuickAction
                href={`/ai/call?id=${job.id}${job.status === 'closed' || job.status === 'confirmation' ? '&purpose=followup' : ''}` as Href}
                icon={<CallMark size={22} />}
                label="AI Call"
              />
            </View>
          </View>
        )}

        {!cancelled && <AiAssistance job={job} />}

        {!cancelled && (
          <View>
            <SectionTitle>Service summary</SectionTitle>
            <ServiceSummary job={job} />
          </View>
        )}

        {!cancelled && (
          <View>
            <SectionTitle>Service record</SectionTitle>
            <Card>
              {tasks.map((t, i) => {
                const inner = (
                  <>
                    <View className={cn('size-10 shrink-0 items-center justify-center rounded-xl', t.done ? 'bg-success-soft' : t.ready ? 'bg-brand-soft' : 'bg-canvas')}>
                      <Icon as={t.done ? ClipboardCheck : t.icon} className={cn('size-5', t.done ? 'text-success' : t.ready ? 'text-brand' : 'text-faint')} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className={cn('text-sm font-extrabold', !t.ready && 'text-faint')}>{t.label}</Text>
                      <Text numberOfLines={1} className="text-xs font-medium text-muted">
                        {t.detail}
                      </Text>
                    </View>
                    {t.ready && <Icon as={ChevronRight} className="size-4 text-faint" />}
                  </>
                )
                const row = cn('flex-row items-center gap-3 p-3', i > 0 && 'border-t border-line')
                return t.ready ? (
                  <Tappable key={t.label} href={t.href} className={cn(row, 'active:bg-canvas active:opacity-100')}>
                    {inner}
                  </Tappable>
                ) : (
                  <View key={t.label} className={row} accessibilityState={{ disabled: true }}>
                    {inner}
                  </View>
                )
              })}
            </Card>
          </View>
        )}

        <View>
          <SectionTitle>Timeline</SectionTitle>
          <Card className="p-4">
            <Timeline job={job} />
          </Card>
        </View>
      </Page>

      {!cancelled && next && (
        <ActionDock>
          {g ? (
            <Button size="lg" className="flex-1" textClassName="font-extrabold" href={g.href}>
              {g.label}
            </Button>
          ) : (
            <Button
              size="lg"
              variant={next.to === 'accepted' ? 'success' : 'primary'}
              className="flex-1"
              textClassName="font-extrabold"
              onPress={() => store.advance(job.id, next.to)}
            >
              {next.label}
            </Button>
          )}
        </ActionDock>
      )}
      {job.status === 'closed' && (
        <ActionDock>
          <Button variant="secondary" size="lg" className="flex-1 border-2" textClassName="font-extrabold" href={stepHref('bill', job.id)}>
            <Icon as={Receipt} className="size-5" />
            View service bill
          </Button>
        </ActionDock>
      )}
    </>
  )
}

function QuickAction({ href, onPress, icon, label }: { href?: Href; onPress?: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Tappable
      href={href}
      onPress={onPress}
      className="min-h-[4.5rem] flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-card px-1 active:border-ink-2 active:opacity-100"
    >
      {icon}
      <Text className="text-center text-[11.5px] font-extrabold leading-tight">{label}</Text>
    </Tappable>
  )
}

/**
 * Everything the AI helped with on this job: saved service notes, the
 * conversations to reopen, and call summaries.
 */
function AiAssistance({ job }: { job: Job }) {
  const { aiThreads, aiCalls, deleteAi } = useStore()
  const [doomed, setDoomed] = useState<null | { kind: 'chat' | 'call'; id: string; title: string }>(null)
  const threads = aiThreads.filter((t) => t.jobId === job.id)
  const calls = aiCalls.filter((c) => c.jobId === job.id)
  const done = job.status === 'closed' || job.status === 'confirmation'
  const notes = job.serviceNotes
  const tile = 'h-11 grow basis-[47%] flex-row items-center justify-center gap-1.5 rounded-xl'

  return (
    <View>
      <SectionTitle count={threads.length + calls.length || undefined}>AI assistance</SectionTitle>
      <Card>
        <View className="flex-row flex-wrap gap-2 p-3">
          <Tappable href={`/ai/chat?id=${job.id}&q=parts` as Href} className={cn(tile, 'bg-canvas active:bg-brand-soft active:opacity-100')}>
            <Icon as={Package} className="size-4 text-ink-2" />
            <Text className="text-[13px] font-extrabold text-ink-2">Find Required Parts</Text>
          </Tappable>
          <Tappable href={`/ai/chat?id=${job.id}&q=notes` as Href} className={cn(tile, 'bg-canvas active:bg-brand-soft active:opacity-100')}>
            <Icon as={NotebookPen} className="size-4 text-ink-2" />
            <Text className="text-[13px] font-extrabold text-ink-2">Service Notes</Text>
          </Tappable>
          {done && (
            <Tappable href={`/ai/call?id=${job.id}&purpose=followup` as Href} className={cn(tile, 'basis-full bg-success-soft')}>
              <Icon as={PhoneCall} className="size-4 text-success" />
              <Text className="text-[13px] font-extrabold text-success">AI Follow-up Call</Text>
            </Tappable>
          )}
        </View>

        {notes && (
          <View className="border-t border-line p-4">
            <Text className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">Service notes · saved {time(notes.savedAt)}</Text>
            <View className="mt-1.5 gap-1.5">
              <Text className="text-sm font-medium text-ink-2">
                <Text className="text-sm font-extrabold">Diagnosis: </Text>
                {notes.diagnosis}
              </Text>
              <Text className="text-sm font-medium text-ink-2">
                <Text className="text-sm font-extrabold">Action taken: </Text>
                {notes.action}
              </Text>
              <Text className="text-sm font-medium text-ink-2">
                <Text className="text-sm font-extrabold">Recommendation: </Text>
                {notes.recommendation}
              </Text>
            </View>
          </View>
        )}

        {threads.map((t) => (
          <View key={t.id} className="flex-row items-center gap-1 border-t border-line pr-2">
            <Tappable href={`/ai/chat?id=${job.id}&t=${t.id}` as Href} className="min-w-0 flex-1 flex-row items-center gap-3 p-3 pr-1 active:bg-canvas active:opacity-100">
              <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                <Icon as={MessageSquareText} className="size-5 text-brand" />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-extrabold">
                  {t.title}
                </Text>
                <Text className="text-xs font-medium text-muted">
                  AI chat · {plural(t.messages.filter((m) => m.role === 'tech').length, 'question')} · {ago(t.updatedAt)}
                </Text>
              </View>
              <Icon as={ChevronRight} className="size-4 text-faint" />
            </Tappable>
            <DeleteKey label={`Delete ${t.title}`} onClick={() => setDoomed({ kind: 'chat', id: t.id, title: t.title })} />
          </View>
        ))}

        {calls.map((c) => (
          <View key={c.id} className="flex-row items-start gap-3 border-t border-line p-3">
            <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft">
              <Icon as={PhoneCall} className="size-5 text-success" />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text numberOfLines={1} className="shrink text-sm font-extrabold">
                  {PURPOSE_LABEL[c.purpose]}
                </Text>
                {(() => {
                  const tone =
                    c.result === 'escalated'
                      ? ['bg-danger-soft', 'text-danger']
                      : c.result === 'reschedule_requested' || c.result === 'follow_up'
                        ? ['bg-warning-soft', 'text-warning']
                        : ['bg-success-soft', 'text-success']
                  return (
                    <View className={cn('shrink-0 rounded-md px-1.5 py-0.5', tone[0])}>
                      <Text className={cn('text-[10px] font-extrabold uppercase', tone[1])}>{RESULT_LABEL[c.result]}</Text>
                    </View>
                  )
                })()}
              </View>
              <Text className="text-xs font-medium text-ink-2">{c.summary.result}</Text>
              {c.summary.request && <Text className="text-xs font-medium text-muted">Request: {c.summary.request}</Text>}
              <Text className="text-[11px] font-semibold text-faint">AI call · {ago(c.at)}</Text>
            </View>
            <DeleteKey label={`Delete ${PURPOSE_LABEL[c.purpose]} summary`} onClick={() => setDoomed({ kind: 'call', id: c.id, title: PURPOSE_LABEL[c.purpose] })} />
          </View>
        ))}

        {!notes && threads.length === 0 && calls.length === 0 && (
          <Text className="border-t border-line p-4 text-sm font-medium text-muted">
            Ask AI for diagnosis help or run an AI call — conversations and call summaries are kept here.
          </Text>
        )}
      </Card>
      <ConfirmDelete
        open={doomed !== null}
        title={doomed?.kind === 'call' ? 'Delete call summary?' : 'Delete conversation?'}
        body={`“${doomed?.title ?? ''}” will be removed from this job. This can’t be undone.`}
        onCancel={() => setDoomed(null)}
        onConfirm={() => {
          if (doomed) deleteAi(doomed.kind === 'chat' ? { threads: [doomed.id] } : { calls: [doomed.id] })
          setDoomed(null)
        }}
      />
    </View>
  )
}
