'use client'

import { useMemo, useState } from 'react'
import { Banknote, Download, IndianRupee, RotateCcw, Wallet } from 'lucide-react'
import { BookingDrawer } from '@/components/BookingDrawer'
import { BarChart, Donut } from '@/components/charts'
import { useToast } from '@/components/toast'
import {
  Button,
  Card,
  CardHeader,
  Chip,
  Empty,
  Modal,
  Page,
  PageHeader,
  Pager,
  SearchInput,
  StatCard,
  TableWrap,
  Tabs,
  td,
  th,
  tr,
} from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL, inr } from '@/lib/catalog'
import { compact, dateTime, downloadCsv, isToday, matches, withinDays } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Booking, PayMethod } from '@/lib/types'

const METHOD_LABEL: Record<PayMethod, string> = { upi: 'UPI', card: 'Card', cash: 'Cash', wallet: 'Wallet' }
type Filter = 'all' | 'paid' | 'unpaid' | 'refunded'
const PAGE = 15

const txnId = (b: Booking) => `TXN-${b.id.replace('BK-', '')}`

function payState(b: Booking): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  if (b.status === 'refunded') return { label: 'Refunded', tone: 'neutral' }
  if (b.paid) return { label: 'Paid', tone: 'success' }
  return { label: b.method === 'cash' ? 'Collect on site' : 'Unpaid', tone: 'warning' }
}

/** Customer-side money: what came in, how it came in, and what went back out. */
export default function Payments() {
  const store = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const [refunding, setRefunding] = useState<Booking | null>(null)

  const all = useMemo(
    () => store.bookings.filter((b) => b.method !== null && b.status !== 'pending_payment').sort((a, z) => z.scheduledAt.localeCompare(a.scheduledAt)),
    [store.bookings]
  )

  const m = useMemo(() => {
    const paid = all.filter((b) => b.paid && b.status !== 'refunded')
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (29 - i))
      const key = d.toDateString()
      const list = paid.filter((b) => new Date(b.scheduledAt).toDateString() === key)
      return {
        label: i === 29 ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: list.reduce((s, b) => s + b.amount, 0),
        detail: `${list.length} payments`,
      }
    })
    const last30 = paid.filter((b) => withinDays(b.scheduledAt, 30))
    const methods = (['upi', 'card', 'cash', 'wallet'] as const).map((k) => ({
      label: METHOD_LABEL[k],
      value: last30.filter((b) => b.method === k).reduce((s, b) => s + b.amount, 0),
    }))
    const refunds = all.filter((b) => b.status === 'refunded' && withinDays(b.scheduledAt, 30))
    const pending = all.filter((b) => !b.paid && b.status !== 'cancelled' && b.status !== 'refunded')
    return {
      today: paid.filter((b) => isToday(b.scheduledAt)).reduce((s, b) => s + b.amount, 0),
      todayCount: paid.filter((b) => isToday(b.scheduledAt)).length,
      month: last30.reduce((s, b) => s + b.amount, 0),
      monthCount: last30.length,
      pending: pending.reduce((s, b) => s + b.amount, 0),
      pendingCount: pending.length,
      refunds: refunds.reduce((s, b) => s + b.amount, 0),
      refundCount: refunds.length,
      days,
      methods,
    }
  }, [all])

  const counts = {
    all: all.length,
    paid: all.filter((b) => b.paid && b.status !== 'refunded').length,
    unpaid: all.filter((b) => !b.paid && b.status !== 'refunded').length,
    refunded: all.filter((b) => b.status === 'refunded').length,
  }

  const rows = all.filter((b) => {
    if (filter === 'paid' && !(b.paid && b.status !== 'refunded')) return false
    if (filter === 'unpaid' && (b.paid || b.status === 'refunded')) return false
    if (filter === 'refunded' && b.status !== 'refunded') return false
    const c = store.customer(b.customerId)
    return matches([b.id, txnId(b), c?.name, c?.phone.replace(/\s/g, ''), b.coupon, b.method ? METHOD_LABEL[b.method] : ''], q)
  })
  const pages = Math.ceil(rows.length / PAGE)
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)

  const exportCsv = () =>
    downloadCsv('payments', [
      ['Transaction', 'Booking', 'Customer', 'Appliance', 'Method', 'Amount', 'Discount', 'Coupon', 'Status', 'Date'],
      ...rows.map((b) => [
        txnId(b),
        b.id,
        store.customer(b.customerId)?.name ?? '',
        `${BRAND_LABEL[b.brand]} ${APPLIANCE_LABEL[b.appliance]}`,
        b.method ? METHOD_LABEL[b.method] : '',
        b.amount,
        b.discount,
        b.coupon ?? '',
        payState(b).label,
        new Date(b.scheduledAt).toLocaleString('en-IN'),
      ]),
    ])

  return (
    <Page>
      <PageHeader
        title="Payments"
        sub="Customer payments, collections on site and refunds"
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Collected today" value={inr(m.today)} icon={<IndianRupee />} toneName="success" hint={<span>{m.todayCount} payments</span>} />
        <StatCard label="Collected · 30 days" value={`₹${compact(m.month)}`} icon={<Wallet />} hint={<span>{m.monthCount} payments</span>} />
        <StatCard label="Pending / collect on site" value={inr(m.pending)} icon={<Banknote />} toneName="warning" hint={<span>{m.pendingCount} bookings</span>} />
        <StatCard label="Refunds · 30 days" value={inr(m.refunds)} icon={<RotateCcw />} toneName="danger" hint={<span>{m.refundCount} refunds</span>} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Daily collections · 30 days" sub="Paid bookings by service date" />
          <div className="px-4 pb-4 pt-5 sm:px-5">
            <BarChart data={m.days} format={inr} labelEvery={5} name="Daily collections, last 30 days" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Payment methods" sub="Share of collections · 30 days" />
          <div className="p-5">
            <Donut slices={m.methods} center={`₹${compact(m.month)}`} centerLabel="Collected" format={inr} />
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <h2 className="text-[15px] font-extrabold tracking-tight">Transactions</h2>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v)
              setPage(0)
            }}
            placeholder="Search transaction, booking, customer, coupon"
            className="w-full sm:w-80"
          />
        </div>
        <Tabs
          className="mt-2 px-3"
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setPage(0)
          }}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'paid', label: 'Paid', count: counts.paid },
            { value: 'unpaid', label: 'Unpaid', count: counts.unpaid },
            { value: 'refunded', label: 'Refunded', count: counts.refunded },
          ]}
        />
        {shown.length === 0 ? (
          <Empty icon={<Wallet />} title="No transactions" body="Nothing matches this filter." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Transaction</th>
                <th className={th}>Booking</th>
                <th className={th}>Customer</th>
                <th className={th}>Method</th>
                <th className={`${th} text-right`}>Amount</th>
                <th className={th}>Discount</th>
                <th className={th}>Status</th>
                <th className={th}>Date</th>
                <th className={`${th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => {
                const st = payState(b)
                const c = store.customer(b.customerId)
                const refundable = b.paid && (b.status === 'completed' || b.status === 'cancelled')
                return (
                  <tr key={b.id} className={tr}>
                    <td className={`${td} num font-semibold text-muted`}>{txnId(b)}</td>
                    <td className={td}>
                      <button type="button" onClick={() => setOpen(b.id)} className="font-bold text-brand hover:underline">
                        {b.id}
                      </button>
                      <span className="block text-xs font-medium text-muted">
                        {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]}
                      </span>
                    </td>
                    <td className={`${td} font-semibold`}>{c?.name}</td>
                    <td className={td}>{b.method ? METHOD_LABEL[b.method] : '—'}</td>
                    <td className={`${td} num text-right font-extrabold`}>{inr(b.amount)}</td>
                    <td className={`${td} text-xs font-semibold text-muted`}>{b.coupon ? `${b.coupon} · −${inr(b.discount)}` : '—'}</td>
                    <td className={td}>
                      <Chip tone={st.tone}>{st.label}</Chip>
                    </td>
                    <td className={`${td} whitespace-nowrap text-xs font-semibold text-muted`}>{dateTime(b.scheduledAt)}</td>
                    <td className={`${td} text-right`}>
                      {refundable ? (
                        <Button size="xs" variant="secondary" onClick={() => setRefunding(b)}>
                          <RotateCcw /> Refund
                        </Button>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
        <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
      </Card>

      <BookingDrawer id={open} onClose={() => setOpen(null)} />

      <Modal
        open={!!refunding}
        onClose={() => setRefunding(null)}
        title="Issue refund?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefunding(null)}>
              Keep payment
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!refunding) return
                store.refund(refunding.id)
                toast(`Refund of ${inr(refunding.amount)} issued for ${refunding.id}`)
                setRefunding(null)
              }}
            >
              Refund {refunding && inr(refunding.amount)}
            </Button>
          </>
        }
      >
        {refunding && (
          <p className="text-sm font-medium text-muted">
            {inr(refunding.amount)} goes back to {store.customer(refunding.customerId)?.name} by{' '}
            {refunding.method ? METHOD_LABEL[refunding.method] : 'the original method'} and {refunding.id} is marked refunded. This cannot be undone.
          </p>
        )}
      </Modal>
    </Page>
  )
}
