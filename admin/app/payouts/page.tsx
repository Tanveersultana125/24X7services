'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useMemo, useState } from 'react'
import { Banknote, CheckCheck, Clock3, Download, Send, Wallet } from 'lucide-react'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, CardHeader, Chip, Empty, Page, PageHeader, StatCard, TableWrap, Tabs, td, th, tr } from '@/components/ui'
import { inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { downloadCsv, longDate, withinDays } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Payout } from '@/lib/types'

type Filter = Payout['status']

const STATUS: Record<Filter, { label: string; tone: 'warning' | 'brand' | 'success' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'brand' },
  paid: { label: 'Paid', tone: 'success' },
}

const net = (p: Payout) => p.gross - p.commission

/** Technician-side money: weekly settlements out, cash deposits in. */
export default function Payouts() {
  const store = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('pending')
  const [selected, setSelected] = useState<string[]>([])

  const m = useMemo(() => {
    const sum = (l: Payout[]) => l.reduce((s, p) => s + net(p), 0)
    const pending = store.payouts.filter((p) => p.status === 'pending')
    const processing = store.payouts.filter((p) => p.status === 'processing')
    const paid = store.payouts.filter((p) => p.status === 'paid' && withinDays(p.at, 30))
    const cash = store.technicians.filter((t) => t.cashInHand > 0).sort((a, z) => z.cashInHand - a.cashInHand)
    return {
      pending: sum(pending),
      pendingCount: pending.length,
      processing: sum(processing),
      processingCount: processing.length,
      paid: sum(paid),
      paidCount: paid.length,
      cash,
      cashTotal: cash.reduce((s, t) => s + t.cashInHand, 0),
    }
  }, [store.payouts, store.technicians])

  const rows = store.payouts.filter((p) => p.status === filter).sort((a, z) => net(z) - net(a))
  const releasable = rows.filter((p) => p.status !== 'paid')
  const chosen = selected.filter((id) => releasable.some((p) => p.id === id))
  const allOn = releasable.length > 0 && chosen.length === releasable.length

  const release = (ids: string[]) => {
    const total = store.payouts.filter((p) => ids.includes(p.id)).reduce((s, p) => s + net(p), 0)
    store.payOut(ids)
    setSelected([])
    toast(`${ids.length} payout${ids.length === 1 ? '' : 's'} released · ${inr(total)}`)
  }

  const exportCsv = () =>
    downloadCsv('payouts', [
      ['Payout', 'Technician', 'Technician ID', 'Period', 'Jobs', 'Gross', 'Commission', 'Net', 'Status', 'Updated'],
      ...rows.map((p) => {
        const t = store.technician(p.technicianId)
        return [p.id, t?.name ?? '', p.technicianId, p.period, p.jobs, p.gross, p.commission, net(p), STATUS[p.status].label, longDate(p.at)]
      }),
    ])

  return (
    <Page>
      <PageHeader
        side="technician"
        title="Payouts"
        sub={`Weekly technician settlements after ${store.settings.commissionPct}% platform commission`}
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Due this week" value={inr(m.pending)} icon={<Wallet />} toneName="warning" hint={<span>{m.pendingCount} technicians</span>} />
        <StatCard label="Processing" value={inr(m.processing)} icon={<Clock3 />} hint={<span>{m.processingCount} transfers</span>} />
        <StatCard label="Paid · 30 days" value={inr(m.paid)} icon={<CheckCheck />} toneName="success" hint={<span>{m.paidCount} payouts</span>} />
        <StatCard label="Cash held by technicians" value={inr(m.cashTotal)} icon={<Banknote />} toneName="danger" hint={<span>{m.cash.length} to deposit</span>} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <h2 className="text-[15px] font-extrabold tracking-tight">Settlements</h2>
            {filter !== 'paid' && (
              <Button size="sm" disabled={!chosen.length} onClick={() => release(chosen)}>
                <Send /> Release selected{chosen.length ? ` (${chosen.length})` : ''}
              </Button>
            )}
          </div>
          <Tabs
            className="mt-2 px-3"
            value={filter}
            onChange={(v) => {
              setFilter(v)
              setSelected([])
            }}
            options={(['pending', 'processing', 'paid'] as const).map((s) => ({
              value: s,
              label: STATUS[s].label,
              count: store.payouts.filter((p) => p.status === s).length,
            }))}
          />
          {rows.length === 0 ? (
            <Empty icon={<Wallet />} title="Nothing here" body="No payouts in this state." />
          ) : (
            <>
            {/* Phone: one card per payout — the table would scroll sideways. */}
            <div className="sm:hidden">
              {filter !== 'paid' && releasable.length > 0 && (
                <label className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 text-xs font-bold text-ink-2">
                  <input
                    type="checkbox"
                    checked={allOn}
                    onChange={() => setSelected(allOn ? [] : releasable.map((p) => p.id))}
                    className="size-4 accent-brand"
                  />
                  Select all
                </label>
              )}
              <ul className="divide-y divide-line">
                {rows.map((p) => {
                  const t = store.technician(p.technicianId)
                  const on = chosen.includes(p.id)
                  return (
                    <li key={p.id} className={cn('flex items-start gap-3 px-4 py-3', on && 'bg-brand-soft/40')}>
                      {filter !== 'paid' && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${p.id}`}
                          checked={on}
                          onChange={() => setSelected((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                          className="mt-2.5 size-4 shrink-0 accent-brand"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/technicians/?id=${p.technicianId}` as Route} className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={t?.name ?? '?'} size={32} side="technician" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold">{t?.name}</span>
                              <span className="block truncate text-xs font-medium text-muted">{p.period}</span>
                            </span>
                          </Link>
                          <Chip tone={STATUS[p.status].tone} className="shrink-0">
                            {STATUS[p.status].label}
                          </Chip>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg bg-canvas px-3 py-2 text-xs">
                          <span>
                            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-faint">Jobs</span>
                            <span className="num font-bold">{p.jobs}</span>
                          </span>
                          <span>
                            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-faint">Gross</span>
                            <span className="num">{inr(p.gross)}</span>
                          </span>
                          <span>
                            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-faint">Comm.</span>
                            <span className="num text-muted">−{inr(p.commission)}</span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-faint">Net</span>
                            <span className="num font-extrabold">{inr(net(p))}</span>
                          </span>
                        </div>
                        {filter !== 'paid' && (
                          <Button size="xs" className="mt-2" onClick={() => release([p.id])}>
                            Release
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="hidden sm:block">
<TableWrap>
              <thead>
                <tr>
                  {filter !== 'paid' && (
                    <th className={cn(th, 'w-10')}>
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={allOn}
                        onChange={() => setSelected(allOn ? [] : releasable.map((p) => p.id))}
                        className="size-4 accent-brand"
                      />
                    </th>
                  )}
                  <th className={th}>Technician</th>
                  <th className={th}>Period</th>
                  <th className={`${th} text-right`}>Jobs</th>
                  <th className={`${th} text-right`}>Gross</th>
                  <th className={`${th} text-right`}>Commission</th>
                  <th className={`${th} text-right`}>Net</th>
                  <th className={th}>Status</th>
                  {filter !== 'paid' && <th className={`${th} text-right`}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const t = store.technician(p.technicianId)
                  const on = chosen.includes(p.id)
                  return (
                    <tr key={p.id} className={cn(tr, on && 'bg-brand-soft/40')}>
                      {filter !== 'paid' && (
                        <td className={td}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${p.id}`}
                            checked={on}
                            onChange={() => setSelected((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                            className="size-4 accent-brand"
                          />
                        </td>
                      )}
                      <td className={td}>
                        <Link href={`/technicians/?id=${p.technicianId}` as Route} className="flex items-center gap-2.5">
                          <Avatar name={t?.name ?? '?'} size={30} side="technician" />
                          <span>
                            <span className="block font-bold hover:text-brand">{t?.name}</span>
                            <span className="block text-xs font-medium text-muted">{p.technicianId}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${td} whitespace-nowrap font-semibold text-ink-2`}>{p.period}</td>
                      <td className={`${td} num text-right font-bold`}>{p.jobs}</td>
                      <td className={`${td} num text-right`}>{inr(p.gross)}</td>
                      <td className={`${td} num text-right text-muted`}>−{inr(p.commission)}</td>
                      <td className={`${td} num text-right font-extrabold`}>{inr(net(p))}</td>
                      <td className={td}>
                        <Chip tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Chip>
                      </td>
                      {filter !== 'paid' && (
                        <td className={`${td} text-right`}>
                          <Button size="xs" onClick={() => release([p.id])}>
                            Release
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </TableWrap>
            </div>
            </>
          )}
          <p className="px-5 py-3 text-xs font-semibold text-muted">
            {rows.length} payouts · net {inr(rows.reduce((s, p) => s + net(p), 0))}
          </p>
        </Card>

        <Card className="self-start">
          <CardHeader title="Cash to deposit" sub="Collected on site, not yet deposited at a hub" />
          {m.cash.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm font-semibold text-muted">No cash outstanding.</p>
          ) : (
            <ul className="divide-y divide-line">
              {m.cash.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={t.name} size={32} side="technician" />
                  <Link href={`/technicians/?id=${t.id}` as Route} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold hover:text-brand">{t.name}</span>
                    <span className={cn('num block text-xs font-bold', t.cashInHand > 5000 ? 'text-danger' : 'text-muted')}>{inr(t.cashInHand)} in hand</span>
                  </Link>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      store.settleCash(t.id)
                      toast(`Deposit of ${inr(t.cashInHand)} recorded for ${t.name}`)
                    }}
                  >
                    Record deposit
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
