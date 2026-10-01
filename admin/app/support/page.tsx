'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, CheckCircle2, Inbox, Phone, RotateCcw, Send } from 'lucide-react'
import { BookingDrawer } from '@/components/BookingDrawer'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, Chip, Drawer, Empty, Page, PageHeader, SearchInput, Segmented, Tabs, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ago, dateTime, matches, telHref } from '@/lib/format'
import { TICKET_PRIORITY, TICKET_STATUS } from '@/lib/status'
import { ADMIN, useStore, useTick } from '@/lib/store'
import type { Ticket, TicketPriority, TicketStatus } from '@/lib/types'

type Side = 'all' | 'customer' | 'technician'
type StatusFilter = TicketStatus | 'all'

const RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

const QUICK = [
  'Sorry for the trouble — looking into this now.',
  'I’ve called the technician; they’ll update you in 10 minutes.',
  'Your refund is initiated and will reach you in 3–5 working days.',
  'Could you share a photo of the issue?',
]

export default function SupportPage() {
  return (
    <Suspense>
      <Support />
    </Suspense>
  )
}

/** One inbox for customers and technicians: urgent first, reply, assign, resolve. */
function Support() {
  const store = useStore()
  const params = useSearchParams()
  useTick(60_000)
  const [side, setSide] = useState<Side>('all')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(params.get('id'))
  const [lastId, setLastId] = useState(params.get('id'))
  if (params.get('id') !== lastId) {
    setLastId(params.get('id'))
    setSel(params.get('id'))
  }

  // The conversation sits beside the list on wide screens and in a drawer below that.
  const [wide, setWide] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const who = (t: Ticket) => (t.side === 'customer' ? store.customer(t.personId)?.name : store.technician(t.personId)?.name) ?? t.personId

  const list = useMemo(
    () =>
      store.tickets
        .filter((t) => (side === 'all' || t.side === side) && (status === 'all' || t.status === status))
        .filter((t) => matches([t.id, t.subject, t.category, t.bookingId, who(t)], q))
        .sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved') || RANK[a.priority] - RANK[b.priority] || b.createdAt.localeCompare(a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.tickets, side, status, q]
  )

  const openCount = (s: Side) => store.tickets.filter((t) => t.status !== 'resolved' && (s === 'all' || t.side === s)).length
  const selected = store.tickets.find((t) => t.id === sel)
  const active = selected ?? (wide ? list[0] : undefined)

  return (
    <Page>
      <PageHeader
        title="Support Tickets"
        sub={`${openCount('all')} open · ${store.tickets.filter((t) => t.status !== 'resolved' && t.priority === 'urgent').length} urgent · customers and technicians in one inbox`}
      />

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="self-start overflow-hidden">
          <Tabs
            className="px-3"
            value={side}
            onChange={setSide}
            options={[
              { value: 'all', label: 'All', count: openCount('all') },
              { value: 'customer', label: 'Customers', count: openCount('customer') },
              { value: 'technician', label: 'Technicians', count: openCount('technician') },
            ]}
          />
          <div className="space-y-2.5 border-b border-line p-3">
            <Segmented
              value={status}
              onChange={setStatus}
              className="flex w-full [&>button]:flex-1"
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'all', label: 'All' },
              ]}
            />
            <SearchInput value={q} onChange={setQ} placeholder="Search tickets…" />
          </div>
          {list.length === 0 ? (
            <Empty icon={<Inbox />} title="Inbox clear" body="No tickets in this view." />
          ) : (
            <ul className="max-h-[calc(100dvh-320px)] min-h-[200px] divide-y divide-line overflow-y-auto">
              {list.map((t) => {
                const on = active?.id === t.id
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSel(t.id)}
                      aria-current={on || undefined}
                      className={cn('relative flex w-full gap-3 px-4 py-3 text-left transition-colors', on ? 'bg-brand-soft/60' : 'hover:bg-canvas/60')}
                    >
                      {on && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}
                      <Avatar name={who(t)} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold">{who(t)}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-faint">{ago(t.createdAt)}</span>
                        </span>
                        <span className="block truncate text-[13px] font-semibold text-ink-2">{t.subject}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Chip tone={TICKET_PRIORITY[t.priority].tone} dot={false} className="h-5 px-1.5 text-[10px]">
                            {TICKET_PRIORITY[t.priority].label}
                          </Chip>
                          <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">{t.side}</span>
                          <span className="text-[11px] font-semibold text-faint">
                            {t.id} · {t.category}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {wide ? (
          active ? (
            <Card className="flex min-h-[560px] flex-col self-start overflow-hidden">
              <Conversation t={active} />
            </Card>
          ) : (
            <Card>
              <Empty icon={<Inbox />} title="Pick a ticket" />
            </Card>
          )
        ) : (
          <Drawer open={!!selected} onClose={() => setSel(null)} title={selected?.subject ?? ''} sub={selected && `${selected.id} · ${selected.category}`}>
            {selected && (
              <div className="-mx-5 -my-5 flex min-h-full flex-col">
                <Conversation t={selected} bare />
              </div>
            )}
          </Drawer>
        )}
      </div>
    </Page>
  )
}

function Conversation({ t, bare }: { t: Ticket; bare?: boolean }) {
  const store = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [booking, setBooking] = useState<string | null>(null)
  const person = t.side === 'customer' ? store.customer(t.personId) : store.technician(t.personId)
  const name = person?.name ?? t.personId
  const href = (t.side === 'customer' ? `/customers/?id=${t.personId}` : `/technicians/?id=${t.personId}`) as Route

  const send = () => {
    if (!text.trim()) return
    store.replyTicket(t.id, text.trim())
    setText('')
    toast(`Reply sent on ${t.id}`)
  }

  return (
    <>
      {!bare && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold tracking-tight">{t.subject}</h2>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {t.id} · {t.category} · opened {dateTime(t.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone={TICKET_PRIORITY[t.priority].tone}>{TICKET_PRIORITY[t.priority].label}</Chip>
            <Chip tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Chip>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas/50 px-5 py-3">
        <Avatar name={name} size={36} />
        <div className="min-w-0 flex-1">
          <Link href={href} className="text-sm font-bold hover:text-brand hover:underline">
            {name}
          </Link>
          <p className="text-xs font-semibold text-muted">
            {t.side === 'customer' ? 'Customer' : 'Technician'} · {t.personId}
            {person && ` · ${person.phone}`}
          </p>
        </div>
        {person && (
          <a href={telHref(person.phone)} className="grid size-8 place-items-center rounded-lg border border-line bg-card text-ink-2 hover:bg-canvas" aria-label={`Call ${name}`}>
            <Phone className="size-4" />
          </a>
        )}
        {t.bookingId && (
          <Button size="sm" variant="secondary" onClick={() => setBooking(t.bookingId!)}>
            <BriefcaseBusiness /> {t.bookingId}
          </Button>
        )}
      </div>

      <ol className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {t.messages.map((m, i) =>
          m.from === 'system' ? (
            <li key={i} className="text-center text-[11px] font-semibold text-faint">
              {m.text} · {ago(m.at)}
            </li>
          ) : (
            <li key={i} className={cn('flex', m.from === 'agent' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm', m.from === 'agent' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-canvas text-ink')}>
                <p className="font-medium leading-relaxed">{m.text}</p>
                <p className={cn('mt-1 text-[10.5px] font-semibold', m.from === 'agent' ? 'text-white/65' : 'text-faint')}>
                  {m.from === 'agent' ? (i === t.messages.length - 1 && t.assignee ? t.assignee : 'Support') : name} · {ago(m.at)}
                </p>
              </div>
            </li>
          )
        )}
      </ol>

      <div className="border-t border-line px-5 py-4">
        {t.status !== 'resolved' && (
          <>
            <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
              {QUICK.map((s) => (
                <button key={s} type="button" onClick={() => setText(s)} className="shrink-0 rounded-pill border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-2 hover:border-line-strong hover:bg-canvas">
                  {s.length > 38 ? s.slice(0, 36) + '…' : s}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send()
                }}
                rows={2}
                placeholder={`Reply to ${name.split(' ')[0]}…`}
                aria-label="Reply"
                className={cn(inputClass, 'min-h-[44px] flex-1 resize-none')}
              />
              <Button onClick={send} disabled={!text.trim()} aria-label="Send reply">
                <Send /> Send
              </Button>
            </div>
          </>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-muted">
            Assignee
            <select
              value={t.assignee ?? ''}
              onChange={(e) => {
                store.assignTicket(t.id, e.target.value)
                toast(`${t.id} assigned to ${e.target.value}`)
              }}
              className={cn(inputClass, 'h-8 w-auto py-0 text-[13px] font-semibold')}
            >
              <option value="" disabled>
                Unassigned
              </option>
              {store.settings.team.map((m) => (
                <option key={m.email} value={m.name}>
                  {m.name}
                  {m.name === ADMIN.name ? ' (you)' : ''} · {m.role}
                </option>
              ))}
            </select>
          </label>
          <span className="flex-1" />
          {t.status === 'resolved' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                store.setTicketStatus(t.id, 'open')
                toast(`${t.id} reopened`)
              }}
            >
              <RotateCcw /> Reopen
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                store.setTicketStatus(t.id, 'resolved')
                toast(`${t.id} resolved`)
              }}
            >
              <CheckCircle2 /> Resolve
            </Button>
          )}
        </div>
      </div>

      <BookingDrawer id={booking} onClose={() => setBooking(null)} />
    </>
  )
}
