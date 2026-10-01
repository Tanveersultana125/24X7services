'use client'

import { useMemo, useState } from 'react'
import { Download, FileText, Pause, PhoneOff, Play, ScrollText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { dateTime, downloadCsv, isToday, matches, withinDays } from '@/lib/format'
import { useStore } from '@/lib/store'
import { CALL_PURPOSES, type AiCallLog, type CallPurpose } from '@/lib/types'
import { BookingDrawer } from './BookingDrawer'
import { useToast } from './toast'
import { Avatar, Button, Card, Chip, Detail, Drawer, Empty, Modal, Pager, SearchInput, SectionLabel, Select, TableWrap, td, th, tr } from './ui'
import { CALL_STATUS, CallStatusChip, SENTIMENT, mmss } from './ai-shared'

const PER_PAGE = 20

type Range = 'all' | 'today' | '7'

/** Every call the voice agent placed, with what came of it. */
export function CallHistoryTab() {
  const store = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [purpose, setPurpose] = useState<CallPurpose | 'all'>('all')
  const [status, setStatus] = useState<AiCallLog['status'] | 'all'>('all')
  const [range, setRange] = useState<Range>('all')
  const [page, setPage] = useState(0)
  const [view, setView] = useState<{ id: string; focus: 'details' | 'transcript' } | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [booking, setBooking] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      store.aiCalls
        .filter((c) => {
          if (purpose !== 'all' && c.purpose !== purpose) return false
          if (status !== 'all' && c.status !== status) return false
          if (range === 'today' && !isToday(c.at)) return false
          if (range === '7' && !withinDays(c.at, 7)) return false
          return matches([c.id, c.bookingId, store.customer(c.customerId)?.name, store.technician(c.technicianId)?.name, c.purpose, c.summary], q)
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    [store, purpose, status, range, q]
  )
  const pages = Math.ceil(rows.length / PER_PAGE)
  const p = Math.min(page, Math.max(pages - 1, 0))
  const shown = rows.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
  const sum = store.aiCalls.find((c) => c.id === summary)

  const exportCsv = () => {
    downloadCsv('ai-calls', [
      ['Call', 'Date', 'Customer', 'Technician', 'Booking', 'Purpose', 'Duration', 'Status', 'Outcome', 'Summary'],
      ...rows.map((c) => [c.id, dateTime(c.at), store.customer(c.customerId)?.name ?? '', store.technician(c.technicianId)?.name ?? '', c.bookingId, c.purpose, mmss(c.durationSec), CALL_STATUS[c.status].label, c.outcome, c.summary]),
    ])
    toast(`Exported ${rows.length} calls`)
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <SearchInput value={q} onChange={(v) => (setQ(v), setPage(0))} placeholder="Search customer, booking, summary" className="min-w-[220px] flex-1" />
        <Select
          label="Purpose"
          value={purpose}
          onChange={(v) => (setPurpose(v), setPage(0))}
          options={[{ value: 'all', label: 'All purposes' }, ...CALL_PURPOSES.map((x) => ({ value: x, label: x }))]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(v) => (setStatus(v), setPage(0))}
          options={[{ value: 'all', label: 'Any status' }, ...(Object.keys(CALL_STATUS) as AiCallLog['status'][]).map((x) => ({ value: x, label: CALL_STATUS[x].label }))]}
        />
        <Select
          label="Date range"
          value={range}
          onChange={(v) => (setRange(v), setPage(0))}
          options={[
            { value: 'all', label: 'All dates' },
            { value: 'today', label: 'Today' },
            { value: '7', label: 'Last 7 days' },
          ]}
        />
        {store.can('ai', 'export') && (
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        )}
      </div>
      {shown.length === 0 ? (
        <Empty icon={<PhoneOff />} title="No calls match" body="Try another purpose, status or date range." />
      ) : (
        <>
        {/* Phone: one card per call — the table would scroll sideways. */}
        <ul className="divide-y divide-line sm:hidden">
          {shown.map((c) => {
            const cu = store.customer(c.customerId)
            const t = store.technician(c.technicianId)
            return (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {cu && <Avatar name={cu.name} size={36} side="customer" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{cu?.name}</span>
                        <span className="block truncate text-xs font-medium text-muted">{c.purpose}</span>
                      </span>
                      <span className="shrink-0">
                        <CallStatusChip status={c.status} />
                      </span>
                    </div>
                    <div className="mt-2 rounded-lg bg-canvas px-3 py-2 text-xs">
                      <p className="line-clamp-2 text-ink-2">{c.summary}</p>
                      <p className="mt-1 flex items-center justify-between gap-2 font-medium text-muted">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {t && <Avatar name={t.name} size={16} side="technician" />}
                          <span className="truncate">{t?.name ?? '—'}</span>
                        </span>
                        <span className="num shrink-0">
                          {dateTime(c.at)} · {c.durationSec ? mmss(c.durationSec) : '—'}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="xs" variant="secondary" onClick={() => setView({ id: c.id, focus: 'details' })}>
                        View
                      </Button>
                      <Button size="xs" variant="secondary" disabled={!c.transcript.length} onClick={() => setView({ id: c.id, focus: 'transcript' })}>
                        <ScrollText /> Transcript
                      </Button>
                      <Button size="xs" variant="secondary" onClick={() => setSummary(c.id)}>
                        <FileText /> Summary
                      </Button>
                      <Button size="xs" variant="subtle" onClick={() => setBooking(c.bookingId)}>
                        {c.bookingId}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="hidden sm:block">
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Technician</th>
              <th className={th}>Booking</th>
              <th className={th}>Purpose</th>
              <th className={th}>Date</th>
              <th className={cn(th, 'text-right')}>Duration</th>
              <th className={th}>Status</th>
              <th className={th}>Summary</th>
              <th className={cn(th, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => {
              const cu = store.customer(c.customerId)
              const t = store.technician(c.technicianId)
              return (
                <tr key={c.id} className={tr}>
                  <td className={td}>
                    <span className="flex items-center gap-2.5">
                      {cu && <Avatar name={cu.name} size={26} side="customer" />}
                      <span>
                        <span className="block font-semibold">{cu?.name}</span>
                        <span className="block text-xs text-muted">{c.id}</span>
                      </span>
                    </span>
                  </td>
                  <td className={td}>
                    {t ? (
                      <span className="flex items-center gap-2">
                        <Avatar name={t.name} size={24} side="technician" />
                        <span className="whitespace-nowrap text-[13px] font-semibold">{t.name}</span>
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className={td}>
                    <button type="button" onClick={() => setBooking(c.bookingId)} className="whitespace-nowrap font-bold text-brand hover:underline">
                      {c.bookingId}
                    </button>
                  </td>
                  <td className={cn(td, 'whitespace-nowrap text-[13px] font-semibold')}>{c.purpose}</td>
                  <td className={cn(td, 'whitespace-nowrap text-[13px] text-ink-2')}>{dateTime(c.at)}</td>
                  <td className={cn(td, 'num text-right font-bold')}>{c.durationSec ? mmss(c.durationSec) : '—'}</td>
                  <td className={td}>
                    <CallStatusChip status={c.status} />
                  </td>
                  <td className={cn(td, 'max-w-[240px]')}>
                    <span className="block truncate text-[13px] text-ink-2">{c.summary}</span>
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <span className="inline-flex gap-1">
                      <Button size="xs" variant="secondary" onClick={() => setView({ id: c.id, focus: 'details' })}>
                        View
                      </Button>
                      <Button size="xs" variant="subtle" disabled={!c.transcript.length} onClick={() => setView({ id: c.id, focus: 'transcript' })}>
                        <ScrollText /> Transcript
                      </Button>
                      <Button size="xs" variant="subtle" onClick={() => setSummary(c.id)}>
                        <FileText /> Summary
                      </Button>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
        </div>
        </>
      )}
      <Pager page={p} pages={pages} total={rows.length} onPage={setPage} />

      <CallDrawer id={view?.id ?? null} focus={view?.focus ?? 'details'} onClose={() => setView(null)} onBooking={setBooking} />

      <Modal open={!!sum} onClose={() => setSummary(null)} title={sum ? `Summary · ${sum.id}` : ''} footer={<Button onClick={() => setSummary(null)}>Done</Button>}>
        {sum && <SummaryBlock call={sum} />}
      </Modal>

      <BookingDrawer id={booking} onClose={() => setBooking(null)} />
    </Card>
  )
}

function SummaryBlock({ call }: { call: AiCallLog }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-relaxed text-ink">{call.summary}</p>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-3 rounded-lg bg-canvas p-3">
        <Detail label="Outcome">{call.outcome}</Detail>
        <Detail label="Sentiment">
          <Chip tone={SENTIMENT[call.sentiment].tone}>{SENTIMENT[call.sentiment].label}</Chip>
        </Detail>
        <Detail label="Duration">{call.durationSec ? mmss(call.durationSec) : '—'}</Detail>
      </dl>
    </div>
  )
}

/** One call in full: who, why, how it went, and the conversation itself. */
export function CallDrawer({ id, focus, onClose, onBooking }: { id: string | null; focus: 'details' | 'transcript'; onClose: () => void; onBooking: (id: string) => void }) {
  const store = useStore()
  const c = store.aiCalls.find((x) => x.id === id)
  if (!c) return null
  const cu = store.customer(c.customerId)
  const t = store.technician(c.technicianId)
  return (
    <Drawer open={!!id} onClose={onClose} title={`${c.purpose}`} sub={<span className="flex flex-wrap items-center gap-2 pt-1"><CallStatusChip status={c.status} />{c.id} · {dateTime(c.at)}</span>}>
      {focus === 'details' && (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-card border border-line p-4">
            <Detail label="Customer">
              <span className="flex items-center gap-2">
                {cu && <Avatar name={cu.name} size={22} side="customer" />}
                {cu?.name}
              </span>
            </Detail>
            <Detail label="Technician">
              <span className="flex items-center gap-2">
                {t && <Avatar name={t.name} size={22} side="technician" />}
                {t?.name ?? '—'}
              </span>
            </Detail>
            <Detail label="Booking">
              <button type="button" onClick={() => onBooking(c.bookingId)} className="font-bold text-brand hover:underline">
                {c.bookingId}
              </button>
            </Detail>
            <Detail label="Duration">{c.durationSec ? mmss(c.durationSec) : '—'}</Detail>
            <Detail label="Recording">{c.recording ? 'Saved' : 'None'}</Detail>
            <Detail label="Phone">{cu?.phone ?? '—'}</Detail>
          </dl>
          <SectionLabel>Summary</SectionLabel>
          <SummaryBlock call={c} />
        </>
      )}
      <SectionLabel>Transcript</SectionLabel>
      <Transcript call={c} />
    </Drawer>
  )
}

/** AI on the left, customer on the right, with the second each line was said. */
export function Transcript({ call }: { call: AiCallLog }) {
  const [playing, setPlaying] = useState(false)
  if (!call.transcript.length) return <p className="rounded-lg bg-canvas px-4 py-6 text-center text-sm font-semibold text-muted">No conversation — {call.outcome.toLowerCase()}.</p>
  return (
    <div className="space-y-4">
      {call.recording && (
        <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? 'Pause recording' : 'Play recording'}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-brand-deep"
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
            <div className={cn('h-full rounded-full bg-brand transition-[width] duration-[8s] ease-linear', playing ? 'w-full' : 'w-[6%]')} />
          </div>
          <span className="num text-xs font-bold text-muted">{mmss(call.durationSec)}</span>
        </div>
      )}
      <ol className="space-y-2.5">
        {call.transcript.map((l, i) => (
          <li key={i} className={cn('flex', l.who === 'customer' && 'justify-end')}>
            <div className={cn('max-w-[82%] rounded-2xl px-3.5 py-2', l.who === 'ai' ? 'rounded-tl-md bg-brand-soft text-ink' : 'rounded-tr-md bg-canvas text-ink')}>
              <p className="text-[11px] font-bold text-muted">
                {l.who === 'ai' ? 'AI agent' : 'Customer'} · <span className="num">{mmss(l.t)}</span>
              </p>
              <p className="text-[13.5px] font-medium leading-relaxed">{l.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Answered calls on the left, the selected conversation on the right. */
export function TranscriptsTab() {
  const store = useStore()
  const [q, setQ] = useState('')
  const list = useMemo(
    () =>
      store.aiCalls
        .filter((c) => c.transcript.length && matches([c.id, c.bookingId, store.customer(c.customerId)?.name, c.purpose, c.summary], q))
        .sort((a, b) => b.at.localeCompare(a.at)),
    [store, q]
  )
  const [sel, setSel] = useState<string | null>(null)
  const [booking, setBooking] = useState<string | null>(null)
  const active = list.find((c) => c.id === sel) ?? list[0]
  const cu = active && store.customer(active.customerId)
  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <div className="border-b border-line p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search transcripts" />
        </div>
        <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
          {list.map((c) => {
            const on = active?.id === c.id
            return (
              <li key={c.id}>
                <button type="button" onClick={() => setSel(c.id)} className={cn('relative flex w-full gap-3 px-4 py-3 text-left', on ? 'bg-brand-soft/60' : 'hover:bg-canvas/60')}>
                  {on && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}
                  <Avatar name={store.customer(c.customerId)?.name ?? '?'} size={30} side="customer" />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="truncate text-sm font-bold">{store.customer(c.customerId)?.name}</span>
                      <span className="num shrink-0 text-[11px] font-semibold text-faint">{mmss(c.durationSec)}</span>
                    </span>
                    <span className="block truncate text-xs font-semibold text-ink-2">{c.purpose}</span>
                    <span className="block truncate text-[11px] text-muted">{dateTime(c.at)}</span>
                  </span>
                </button>
              </li>
            )
          })}
          {!list.length && <li className="px-4 py-10 text-center text-sm font-semibold text-muted">No transcripts match.</li>}
        </ul>
      </Card>
      {active ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[15px] font-extrabold">{active.purpose}</h2>
              <p className="mt-0.5 text-xs font-medium text-muted">
                {cu?.name} ·{' '}
                <button type="button" onClick={() => setBooking(active.bookingId)} className="font-bold text-brand hover:underline">
                  {active.bookingId}
                </button>{' '}
                · {dateTime(active.at)}
              </p>
            </div>
            <span className="flex gap-2">
              <CallStatusChip status={active.status} />
              <Chip tone={SENTIMENT[active.sentiment].tone}>{SENTIMENT[active.sentiment].label}</Chip>
            </span>
          </div>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <Transcript call={active} />
            <div className="h-fit rounded-card border border-line bg-canvas/50 p-4">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">AI summary</p>
              <SummaryBlock call={active} />
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <Empty icon={<ScrollText />} title="No transcripts yet" />
        </Card>
      )}
      <BookingDrawer id={booking} onClose={() => setBooking(null)} />
    </div>
  )
}
