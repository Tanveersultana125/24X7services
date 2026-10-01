'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { AiCallConfig } from '@/lib/types'
import { useToast } from './toast'
import { Card, CardHeader, Field, inputClass, Segmented, Select, Toggle } from './ui'
import { SaveBar, changedKeys, clip } from './ai-shared'

export const VOICES = ['Ananya — warm, Indian English', 'Rohit — calm, Indian English', 'Meera — Hindi & English', 'Kiran — Telugu & English'] as const

const SCRIPTS: { key: keyof AiCallConfig['scripts']; label: string; vars: string[] }[] = [
  { key: 'confirm', label: 'Appointment confirmation', vars: ['{appliance}', '{slot}', '{customer}'] },
  { key: 'eta', label: 'ETA update', vars: ['{technician}', '{eta}'] },
  { key: 'followup', label: 'Customer follow-up', vars: ['{appliance}', '{technician}'] },
  { key: 'reschedule', label: 'Rescheduling', vars: ['{options}', '{slot}'] },
  { key: 'escalation', label: 'Escalation', vars: ['{booking}'] },
]

const LABELS: Partial<Record<keyof AiCallConfig, string>> = {
  enabled: 'enabled',
  name: 'name',
  voice: 'voice',
  language: 'language',
  greeting: 'greeting',
  maxDurationMin: 'call duration',
  callingHours: 'calling hours',
  recording: 'recording settings',
  summary: 'summary settings',
}

/** The outbound voice agent: how it sounds, what it says, and its limits. */
export function CallAgentTab({ readOnly }: { readOnly: boolean }) {
  const store = useStore()
  const toast = useToast()
  const saved = store.aiCall
  const [d, setD] = useState<AiCallConfig>(saved)
  const set = <K extends keyof AiCallConfig>(k: K, v: AiCallConfig[K]) => setD((x) => ({ ...x, [k]: v }))
  const dirty = JSON.stringify(d) !== JSON.stringify(saved)

  const save = () => {
    const changedScripts = SCRIPTS.filter((s) => saved.scripts[s.key] !== d.scripts[s.key])
    const other = changedKeys({ ...saved, scripts: null }, { ...d, scripts: null }, LABELS)
    if (changedScripts.length === 1 && other.length === 0) {
      const s = changedScripts[0]!
      store.updateAiCall(d, { action: 'Updated AI call script', target: `${s.label} script`, old: `“${clip(saved.scripts[s.key], 48)}”`, new: `“${clip(d.scripts[s.key], 48)}”` })
    } else {
      const names = [...other, ...changedScripts.map((s) => `${s.label.toLowerCase()} script`)]
      store.updateAiCall(d, { action: 'Updated AI call agent', target: names.join(', ') })
    }
    toast('AI call agent saved')
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Voice & identity"
          sub="Every call opens by saying it is an automated assistant"
          action={
            <span className="flex items-center gap-2 text-[13px] font-bold text-ink-2">
              {d.enabled ? 'Enabled' : 'Disabled'}
              <Toggle checked={d.enabled} onChange={(v) => !readOnly && set('enabled', v)} label="Enable AI call" />
            </span>
          }
        />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="AI voice">
            <Select label="AI voice" className="w-full" value={d.voice} onChange={(v) => !readOnly && set('voice', v)} options={VOICES.map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="AI name">
            <input className={inputClass} value={d.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Language">
            <Select
              label="Language"
              className="w-full"
              value={d.language}
              onChange={(v) => !readOnly && set('language', v)}
              options={['English', 'English + Hindi', 'English + Telugu', 'Hindi'].map((v) => ({ value: v, label: v }))}
            />
          </Field>
          <Field label="Call greeting" className="sm:col-span-3">
            <div className="relative">
              <Mic className="pointer-events-none absolute left-3 top-3 size-4 text-faint" aria-hidden />
              <textarea className={`${inputClass} pl-9`} rows={2} value={d.greeting} disabled={readOnly} onChange={(e) => set('greeting', e.target.value)} />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Call scripts" sub="Words in {braces} are filled in from the booking when the call is placed" />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {SCRIPTS.map((s) => (
            <Field
              key={s.key}
              label={`${s.label} script`}
              hint={
                <span className="flex flex-wrap gap-1">
                  {s.vars.map((v) => (
                    <code key={v} className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-bold text-ink-2">
                      {v}
                    </code>
                  ))}
                </span>
              }
            >
              <textarea
                className={inputClass}
                rows={3}
                value={d.scripts[s.key]}
                disabled={readOnly}
                onChange={(e) => set('scripts', { ...d.scripts, [s.key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Call limits" />
          <div className="space-y-4 p-5">
            <Field label="Maximum call duration" hint="The agent wraps up and offers a human after this.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={15}
                  className={`${inputClass} w-24`}
                  value={d.maxDurationMin}
                  disabled={readOnly}
                  onChange={(e) => set('maxDurationMin', Math.max(1, Math.min(15, Number(e.target.value) || 1)))}
                />
                <span className="text-sm font-semibold text-muted">minutes</span>
              </div>
            </Field>
            <Field label="Calling hours" hint="Except emergencies, which call any time.">
              <div className="flex items-center gap-2">
                <input type="time" className={inputClass} value={d.callingHours.start} disabled={readOnly} onChange={(e) => set('callingHours', { ...d.callingHours, start: e.target.value })} />
                <span className="text-sm text-muted">to</span>
                <input type="time" className={inputClass} value={d.callingHours.end} disabled={readOnly} onChange={(e) => set('callingHours', { ...d.callingHours, end: e.target.value })} />
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recording" />
          <div className="divide-y divide-line">
            <Row title="Record calls" sub="Stored for quality and disputes">
              <Toggle checked={d.recording.enabled} onChange={(v) => !readOnly && set('recording', { ...d.recording, enabled: v })} label="Record calls" />
            </Row>
            <Row title="Ask for consent" sub="“This call may be recorded…”">
              <Toggle checked={d.recording.consent} onChange={(v) => !readOnly && set('recording', { ...d.recording, consent: v })} label="Consent prompt" />
            </Row>
            <Row title="Keep recordings for" sub="Then deleted automatically">
              <Select
                label="Retention"
                value={String(d.recording.retentionDays)}
                onChange={(v) => !readOnly && set('recording', { ...d.recording, retentionDays: Number(v) })}
                options={['30', '60', '90', '180'].map((v) => ({ value: v, label: `${v} days` }))}
              />
            </Row>
          </div>
        </Card>

        <Card>
          <CardHeader title="Call summary" />
          <div className="divide-y divide-line">
            <Row title="Auto summary" sub="Written as the call ends">
              <Toggle checked={d.summary.auto} onChange={(v) => !readOnly && set('summary', { ...d.summary, auto: v })} label="Auto summary" />
            </Row>
            <Row title="Attach to booking" sub="Shown in the booking timeline">
              <Toggle checked={d.summary.attachToBooking} onChange={(v) => !readOnly && set('summary', { ...d.summary, attachToBooking: v })} label="Attach to booking" />
            </Row>
            <Row title="Notify technician" sub="Push to the technician app">
              <Toggle checked={d.summary.notifyTechnician} onChange={(v) => !readOnly && set('summary', { ...d.summary, notifyTechnician: v })} label="Notify technician" />
            </Row>
            <Row title="Format">
              <Segmented
                value={d.summary.format}
                onChange={(v) => !readOnly && set('summary', { ...d.summary, format: v })}
                options={[
                  { value: 'Short', label: 'Short' },
                  { value: 'Detailed', label: 'Detailed' },
                ]}
              />
            </Row>
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} disabled={readOnly} onReset={() => setD(saved)} onSave={save} />
    </div>
  )
}

function Row({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
