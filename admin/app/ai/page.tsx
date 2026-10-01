'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { Bot, Cpu, Eye, Gauge, PhoneCall, PhoneForwarded, Timer } from 'lucide-react'
import { CallAgentTab } from '@/components/ai-call'
import { ChatAgentTab } from '@/components/ai-chat'
import { CallHistoryTab, TranscriptsTab } from '@/components/ai-history'
import { ToggleChip, mmss } from '@/components/ai-shared'
import { useToast } from '@/components/toast'
import { Card, CardHeader, Chip, Page, PageHeader, StatCard, Tabs, Toggle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { isToday } from '@/lib/format'
import { useStore } from '@/lib/store'

const TABS = [
  { value: 'chat', label: 'AI Chat Agent' },
  { value: 'call', label: 'AI Call Agent' },
  { value: 'history', label: 'Call History' },
  { value: 'transcripts', label: 'Call Transcripts' },
  { value: 'settings', label: 'AI Settings' },
] as const
type Tab = (typeof TABS)[number]['value']

export default function AiPage() {
  return (
    <Suspense>
      <AiCenter />
    </Suspense>
  )
}

/** Both AI agents in one place: what they say, how they behave, and every call they made. */
function AiCenter() {
  const store = useStore()
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = TABS.some((t) => t.value === raw) ? (raw as Tab) : 'chat'
  const readOnly = !store.can('ai', 'edit')

  const stats = useMemo(() => {
    const calls = store.aiCalls
    const today = calls.filter((c) => isToday(c.at))
    const answered = calls.filter((c) => c.status === 'completed' || c.status === 'escalated')
    return {
      today: today.length,
      completion: calls.length ? Math.round((calls.filter((c) => c.status === 'completed').length / calls.length) * 100) : 0,
      avg: answered.length ? Math.round(answered.reduce((s, c) => s + c.durationSec, 0) / answered.length) : 0,
      escalations: calls.filter((c) => c.status === 'escalated').length,
      total: calls.length,
    }
  }, [store.aiCalls])

  return (
    <Page>
      <PageHeader
        title="AI Center"
        sub="Configure the AI chat and call agents and review every automated call"
        actions={
          <>
            {readOnly && (
              <Chip tone="neutral">
                <Eye className="size-3" /> View only
              </Chip>
            )}
            <Chip tone={store.aiChat.enabled ? 'success' : 'neutral'}>Chat agent {store.aiChat.enabled ? 'On' : 'Off'}</Chip>
            <Chip tone={store.aiCall.enabled ? 'success' : 'neutral'}>Call agent {store.aiCall.enabled ? 'On' : 'Off'}</Chip>
          </>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-label="AI calls at a glance">
        <StatCard label="Calls today" value={stats.today} icon={<PhoneCall />} hint={<span>{stats.total} in the last 6 days</span>} />
        <StatCard label="Completion rate" value={`${stats.completion}%`} icon={<Gauge />} toneName="success" hint={<span>Reached and resolved</span>} />
        <StatCard label="Avg. call duration" value={mmss(stats.avg)} icon={<Timer />} toneName="info" hint={<span>Answered calls</span>} />
        <StatCard label="Escalations" value={stats.escalations} icon={<PhoneForwarded />} toneName={stats.escalations ? 'warning' : 'neutral'} hint={<span>Handed to support</span>} />
      </section>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(v) => router.replace(`/ai/?tab=${v}` as Route, { scroll: false })}
        options={TABS.map((t) => ({ ...t, count: t.value === 'history' ? stats.total : undefined }))}
      />

      {tab === 'chat' && <ChatAgentTab key="chat" readOnly={readOnly} />}
      {tab === 'call' && <CallAgentTab key="call" readOnly={readOnly} />}
      {tab === 'history' && <CallHistoryTab />}
      {tab === 'transcripts' && <TranscriptsTab />}
      {tab === 'settings' && <AiSettings readOnly={readOnly} />}
    </Page>
  )
}

const LANGS = ['English', 'Hindi', 'Telugu', 'Urdu'] as const

/** Switches that apply to both agents, saved as they are flipped. */
function AiSettings({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const chat = store.aiChat
  const call = store.aiCall
  const langs = LANGS.filter((l) => call.language.includes(l))

  const flip = (which: 'chat' | 'call', on: boolean) => {
    if (readOnly) return
    if (which === 'chat') store.updateAiChat({ enabled: on }, { action: on ? 'Enabled AI chat agent' : 'Disabled AI chat agent', target: chat.name, old: on ? 'Off' : 'On', new: on ? 'On' : 'Off' })
    else store.updateAiCall({ enabled: on }, { action: on ? 'Enabled AI call agent' : 'Disabled AI call agent', target: call.name, old: on ? 'Off' : 'On', new: on ? 'On' : 'Off' })
    toast(`AI ${which} agent ${on ? 'enabled' : 'disabled'}`)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Agents" sub="Turning an agent off routes customers to the human support desk" />
        <div className="divide-y divide-line">
          {(
            [
              ['chat', 'AI Chat Agent', `${chat.name} · technical assistance in chat`, chat.enabled, Bot],
              ['call', 'AI Call Agent', `${call.name} · ${call.voice.split(' —')[0]} voice`, call.enabled, PhoneCall],
            ] as const
          ).map(([k, title, sub, on, Icon]) => (
            <div key={k} className="flex items-center gap-3 px-5 py-4">
              <span className={cn('grid size-9 place-items-center rounded-lg', on ? 'bg-success-soft text-success' : 'bg-canvas text-muted')}>
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{title}</p>
                <p className="truncate text-xs text-muted">{sub}</p>
              </div>
              <Toggle checked={on} onChange={(v) => flip(k, v)} label={title} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Fallback to a human" sub="When the AI hands over to the support desk" />
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-sm font-bold">Chat handoff</p>
              <p className="text-xs text-muted">On request, or after two unresolved answers</p>
            </div>
            <Toggle
              checked={chat.handoff}
              onChange={(v) => {
                if (readOnly) return
                store.updateAiChat({ handoff: v }, { action: 'Changed chat handoff', old: chat.handoff ? 'On' : 'Off', new: v ? 'On' : 'Off' })
                toast(`Chat handoff ${v ? 'on' : 'off'}`)
              }}
              label="Chat handoff"
            />
          </div>
          <ul className="space-y-1.5 px-5 py-4 text-[13px] font-medium text-ink-2">
            <li>• Safety words (sparks, gas smell, burning) — immediate emergency booking offer</li>
            <li>• Angry or negative sentiment on a call — escalation script, then support</li>
            <li>• Calls longer than {call.maxDurationMin} minutes — wrap up and offer a human</li>
            <li>• Refunds, price disputes and slot guarantees — always a human</li>
          </ul>
        </div>
      </Card>

      <Card>
        <CardHeader title="Languages" sub="What the call agent may speak" />
        <div className="flex flex-wrap gap-2 p-5">
          {LANGS.map((l) => (
            <ToggleChip
              key={l}
              disabled={readOnly}
              on={langs.includes(l)}
              onClick={() => {
                const next = langs.includes(l) ? langs.filter((x) => x !== l) : LANGS.filter((x) => x === l || langs.includes(x))
                if (!next.length) return
                const value = next.join(' + ')
                store.updateAiCall({ language: value }, { action: 'Changed AI call languages', old: call.language, new: value })
                toast(`Call languages: ${value}`)
              }}
            >
              {l}
            </ToggleChip>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Data & retention" />
        <dl className="divide-y divide-line text-[13px]">
          {[
            ['Call recordings', call.recording.enabled ? `Kept ${call.recording.retentionDays} days` : 'Not recorded'],
            ['Consent prompt', call.recording.consent ? 'Played at call start' : 'Off'],
            ['Call summaries', call.summary.auto ? `${call.summary.format}, ${call.summary.attachToBooking ? 'attached to booking' : 'not attached'}` : 'Off'],
            ['Chat transcripts', 'Kept with the booking for 12 months'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-5 py-3">
              <dt className="font-semibold text-muted">{k}</dt>
              <dd className="text-right font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-start gap-3 p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Cpu className="size-[18px]" />
          </span>
          <div>
            <p className="text-sm font-bold">Model</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              Both agents currently run as on-device simulations from a curated reference and scripted call plans — no hosted model or phone line is connected. Everything configured here
              (names, scripts, rules, scope) is what a connected model will receive once a backend and API key are added.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
