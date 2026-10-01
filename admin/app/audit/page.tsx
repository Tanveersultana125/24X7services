'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Download, FileClock, Lock, ShieldCheck, Users } from 'lucide-react'
import { useToast } from '@/components/toast'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Detail,
  Drawer,
  Page,
  PageHeader,
  Pager,
  SearchInput,
  Select,
  SectionLabel,
  StatCard,
  TableWrap,
  inputClass,
  td,
  th,
  tr,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { MODULE_LABEL } from '@/lib/control'
import { ago, downloadCsv, isToday, longDate, matches, time, withinDays } from '@/lib/format'
import { useStore } from '@/lib/store'
import { MODULES, type AuditEntry, type Module } from '@/lib/types'

const PER_PAGE = 25

type Range = 'today' | '7d' | '30d' | 'all' | 'custom'

const RANGES: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
]

/** Every accountable change, newest first. Read-only for everyone — the log can't be edited. */
export default function AuditPage() {
  const store = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [admin, setAdmin] = useState('all')
  const [mod, setMod] = useState<Module | 'all'>('all')
  const [action, setAction] = useState('all')
  const [range, setRange] = useState<Range>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<AuditEntry | null>(null)

  const entries = store.audit
  const admins = useMemo(() => [...new Set(entries.map((e) => e.admin))].sort(), [entries])
  const actions = useMemo(() => [...new Set(entries.map((e) => e.action))].sort(), [entries])

  const list = useMemo(() => {
    const inRange = (iso: string) => {
      if (range === 'today') return isToday(iso)
      if (range === '7d') return withinDays(iso, 7)
      if (range === '30d') return withinDays(iso, 30)
      if (range === 'custom') {
        const t = new Date(iso).getTime()
        if (from && t < new Date(`${from}T00:00:00`).getTime()) return false
        if (to && t > new Date(`${to}T23:59:59`).getTime()) return false
      }
      return true
    }
    return entries.filter(
      (e) =>
        (admin === 'all' || e.admin === admin) &&
        (mod === 'all' || e.module === mod) &&
        (action === 'all' || e.action === action) &&
        inRange(e.at) &&
        matches([e.action, e.target, e.old, e.new, e.admin, MODULE_LABEL[e.module], e.id], q)
    )
  }, [entries, admin, mod, action, range, from, to, q])

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const cur = Math.min(page, pages - 1)
  const rows = list.slice(cur * PER_PAGE, (cur + 1) * PER_PAGE)

  const today = entries.filter((e) => isToday(e.at))
  const counts = new Map<Module, number>()
  for (const e of entries) if (withinDays(e.at, 7)) counts.set(e.module, (counts.get(e.module) ?? 0) + 1)
  const topModules = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const activeToday = new Set(today.filter((e) => e.role !== 'System').map((e) => e.admin)).size

  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(0)
  }

  return (
    <Page>
      <PageHeader
        title="Audit Logs"
        sub="Who changed what, where, and what it was before — every admin action is recorded here"
        actions={
          <>
            <Chip tone="success" className="h-8 px-3 text-xs">
              <Lock className="size-3.5" aria-hidden /> Read-only · tamper-evident
            </Chip>
            {store.can('audit', 'export') && (
              <Button
                variant="secondary"
                onClick={() => {
                  downloadCsv('audit-log', [
                    ['Entry', 'Date', 'Time', 'Admin', 'Role', 'Module', 'Action', 'Target', 'Old value', 'New value'],
                    ...list.map((e) => [e.id, longDate(e.at), time(e.at), e.admin, e.role, MODULE_LABEL[e.module], e.action, e.target ?? '', e.old ?? '', e.new ?? '']),
                  ])
                  toast(`Exported ${list.length} audit entries`)
                }}
              >
                <Download /> Export CSV
              </Button>
            )}
          </>
        }
      />

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:gap-4" aria-label="Audit summary">
        <StatCard label="Entries today" value={today.length} icon={<FileClock />} hint={<span>{entries.length} recorded in total</span>} />
        <div className="rounded-card border border-line bg-card p-4 shadow-card sm:p-5">
          <p className="text-[13px] font-bold text-muted">Most changed · 7 days</p>
          <ul className="mt-2.5 space-y-1.5">
            {topModules.length === 0 && <li className="text-sm font-semibold text-faint">No changes this week</li>}
            {topModules.map(([m, n]) => (
              <li key={m} className="flex items-center justify-between gap-3 text-[13px]">
                <button type="button" onClick={() => reset(setMod)(m)} className="truncate font-semibold text-ink-2 hover:text-brand hover:underline">
                  {MODULE_LABEL[m]}
                </button>
                <span className="num font-extrabold">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <StatCard label="Admins active today" value={activeToday} icon={<Users />} toneName="info" hint={<span>{store.admins.filter((a) => a.status === 'active').length} active accounts</span>} />
      </section>

      <Card>
        <div className="space-y-2 border-b border-line p-4">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="Search action, target or values" />
          <div className="flex flex-wrap gap-2">
            <Select value={admin} onChange={reset(setAdmin)} label="Admin" options={[{ value: 'all', label: 'All admins' }, ...admins.map((a) => ({ value: a, label: a }))]} />
            <Select
              value={mod}
              onChange={reset(setMod)}
              label="Module"
              options={[{ value: 'all' as const, label: 'All modules' }, ...MODULES.map((m) => ({ value: m, label: MODULE_LABEL[m] }))]}
            />
            <Select value={action} onChange={reset(setAction)} label="Action" options={[{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))]} />
            <Select value={range} onChange={reset(setRange)} label="Date range" options={RANGES} />
            {range === 'custom' && (
              <span className="flex flex-wrap items-center gap-2">
                <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className={cn(inputClass, 'h-10 w-auto')} />
                <span className="text-xs font-semibold text-muted">to</span>
                <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className={cn(inputClass, 'h-10 w-auto')} />
              </span>
            )}
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Time</th>
              <th className={th}>Admin</th>
              <th className={th}>Module</th>
              <th className={th}>Action</th>
              <th className={th}>Target</th>
              <th className={th}>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-muted">
                  No audit entries match these filters.
                </td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className={cn(tr, 'cursor-pointer')} onClick={() => setOpen(e)}>
                <td className={cn(td, 'num text-[13px] font-semibold')}>{longDate(e.at)}</td>
                <td className={cn(td, 'num whitespace-nowrap text-[13px] text-muted')}>{time(e.at)}</td>
                <td className={td}>
                  <span className="flex items-center gap-2">
                    {e.role === 'System' ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-canvas text-muted">
                        <ShieldCheck className="size-3.5" aria-hidden />
                      </span>
                    ) : (
                      <Avatar name={e.admin} size={24} />
                    )}
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-[13px] font-bold">{e.admin}</span>
                      <span className="block whitespace-nowrap text-[11px] font-medium text-muted">{e.role}</span>
                    </span>
                  </span>
                </td>
                <td className={td}>
                  <Chip tone="neutral" dot={false}>
                    {MODULE_LABEL[e.module]}
                  </Chip>
                </td>
                <td className={cn(td, 'font-semibold')}>{e.action}</td>
                <td className={cn(td, 'max-w-[200px] truncate text-[13px] text-ink-2')} title={e.target}>
                  {e.target ?? '—'}
                </td>
                <td className={td}>
                  <ChangeCell e={e} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <Pager page={cur} pages={pages} total={list.length} onPage={setPage} />
      </Card>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.action ?? ''}
        sub={
          open && (
            <span className="flex flex-wrap items-center gap-2 pt-1">
              <Chip tone="neutral" dot={false}>
                {MODULE_LABEL[open.module]}
              </Chip>
              <span>{ago(open.at)}</span>
            </span>
          )
        }
      >
        {open && (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-card border border-line p-4">
              <Detail label="Admin">{open.admin}</Detail>
              <Detail label="Role">{open.role}</Detail>
              <Detail label="Date">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-faint" aria-hidden /> {longDate(open.at)}
                </span>
              </Detail>
              <Detail label="Time">{time(open.at)}</Detail>
              <Detail label="Module">{MODULE_LABEL[open.module]}</Detail>
              <Detail label="Target">{open.target ?? '—'}</Detail>
            </dl>
            <SectionLabel>Change</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-lg border border-danger/20 bg-danger-soft/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-danger">Old value</p>
                <p className="mt-1 break-words text-sm font-semibold text-ink-2">{open.old ?? '—'}</p>
              </div>
              <ArrowRight className="mx-auto size-4 rotate-90 text-faint sm:rotate-0" aria-hidden />
              <div className="rounded-lg border border-success/20 bg-success-soft/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-success">New value</p>
                <p className="mt-1 break-words text-sm font-semibold text-ink-2">{open.new ?? '—'}</p>
              </div>
            </div>
            <SectionLabel>Record</SectionLabel>
            <p className="flex items-start gap-2 rounded-lg bg-canvas px-3 py-2.5 text-xs font-medium text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Entry <span className="num font-bold text-ink-2">{open.id}</span> · recorded {new Date(open.at).toLocaleString('en-IN')}. Audit entries can’t be edited or deleted.
              </span>
            </p>
          </>
        )}
      </Drawer>
    </Page>
  )
}

/** Old → new, compact enough for a table cell. */
function ChangeCell({ e }: { e: AuditEntry }) {
  if (!e.old && !e.new) return <span className="text-xs text-faint">—</span>
  return (
    <span className="flex max-w-[280px] items-center gap-1.5 text-[13px]">
      {e.old && (
        <span className="truncate rounded bg-danger-soft/70 px-1.5 py-0.5 font-semibold text-danger line-through decoration-danger/40" title={e.old}>
          {e.old}
        </span>
      )}
      {e.old && e.new && <ArrowRight className="size-3.5 shrink-0 text-faint" aria-hidden />}
      {e.new && (
        <span className="truncate rounded bg-success-soft/70 px-1.5 py-0.5 font-semibold text-success" title={e.new}>
          {e.new}
        </span>
      )}
    </span>
  )
}
