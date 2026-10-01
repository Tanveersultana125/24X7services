'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Ban, Download, Gift, Mail, MapPin, Phone, Repeat, UserPlus, Users, Wallet } from 'lucide-react'
import { BookingDrawer } from '@/components/BookingDrawer'
import { ApplianceGlyph } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Detail,
  Drawer,
  Empty,
  Modal,
  Page,
  PageHeader,
  Pager,
  Rating,
  SearchInput,
  SectionLabel,
  Select,
  StatCard,
  StatusChip,
  TableWrap,
  Tabs,
  buttonClass,
  td,
  th,
  tr,
} from '@/components/ui'
import { APPLIANCE_LABEL, BRAND_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, dateTime, downloadCsv, longDate, matches, telHref, withinDays } from '@/lib/format'
import { AREAS } from '@/lib/seed'
import { TICKET_STATUS } from '@/lib/status'
import { useStore } from '@/lib/store'
import type { Booking, Customer } from '@/lib/types'

const PAGE = 25

interface Row {
  c: Customer
  bookings: Booking[]
  spend: number
  last?: string
}

export default function CustomersPage() {
  return (
    <Suspense>
      <Customers />
    </Suspense>
  )
}

/** Everyone who has booked through the customer app, with what they spent and how it went. */
function Customers() {
  const store = useStore()
  const router = useRouter()
  const params = useSearchParams()
  const openId = params.get('id')
  const [tab, setTab] = useState<'all' | 'active' | 'blocked'>('all')
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [page, setPage] = useState(0)

  const rows = useMemo<Row[]>(() => {
    const byCustomer = new Map<string, Booking[]>()
    for (const b of store.bookings) byCustomer.set(b.customerId, [...(byCustomer.get(b.customerId) ?? []), b])
    return store.customers.map((c) => {
      const bookings = (byCustomer.get(c.id) ?? []).sort((a, z) => z.scheduledAt.localeCompare(a.scheduledAt))
      return {
        c,
        bookings,
        spend: bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.amount, 0),
        last: bookings.find((b) => new Date(b.scheduledAt).getTime() <= Date.now())?.scheduledAt ?? bookings[0]?.scheduledAt,
      }
    })
  }, [store.bookings, store.customers])

  const filtered = rows
    .filter((r) => tab === 'all' || r.c.status === tab)
    .filter((r) => area === 'all' || r.c.area === area)
    .filter((r) => matches([r.c.id, r.c.name, r.c.phone.replace(/\s/g, ''), r.c.email, r.c.area], q))
    .sort((a, z) => z.spend - a.spend)
  const pages = Math.ceil(filtered.length / PAGE)
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE)

  const repeat = rows.length ? Math.round((rows.filter((r) => r.bookings.length > 1).length / rows.filter((r) => r.bookings.length).length) * 100) : 0
  const setOpen = (id: string | null) => router.replace((id ? `/customers/?id=${id}` : '/customers') as Route, { scroll: false })

  const exportCsv = () =>
    downloadCsv('customers', [
      ['ID', 'Name', 'Phone', 'Email', 'Area', 'Bookings', 'Lifetime spend', 'Wallet credit', 'Status', 'Joined'],
      ...filtered.map((r) => [r.c.id, r.c.name, r.c.phone, r.c.email, r.c.area, r.bookings.length, r.spend, r.c.walletCredit, r.c.status, longDate(r.c.joinedAt)]),
    ])

  return (
    <Page>
      <PageHeader
        side="customer"
        title="Customers"
        sub="Everyone booking through the 24X7 customer app"
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Total customers" value={store.customers.length} icon={<Users />} />
        <StatCard label="New · last 30 days" value={store.customers.filter((c) => withinDays(c.joinedAt, 30)).length} icon={<UserPlus />} toneName="success" />
        <StatCard label="Repeat rate" value={`${repeat}%`} icon={<Repeat />} toneName="info" hint={<span>Booked more than once</span>} />
        <StatCard label="Blocked" value={store.customers.filter((c) => c.status === 'blocked').length} icon={<Ban />} toneName="danger" />
      </section>

      <Card className="mt-5">
        <Tabs
          className="px-3"
          value={tab}
          onChange={(v) => {
            setTab(v)
            setPage(0)
          }}
          options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'active', label: 'Active', count: rows.filter((r) => r.c.status === 'active').length },
            { value: 'blocked', label: 'Blocked', count: rows.filter((r) => r.c.status === 'blocked').length },
          ]}
        />
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <SearchInput
            className="flex-1"
            value={q}
            onChange={(v) => {
              setQ(v)
              setPage(0)
            }}
            placeholder="Search name, phone, email or ID"
          />
          <Select
            label="Area"
            value={area}
            onChange={(v) => {
              setArea(v)
              setPage(0)
            }}
            options={[{ value: 'all', label: 'All areas' }, ...AREAS.map((a) => ({ value: a.area, label: a.area }))]}
          />
        </div>

        {shown.length === 0 ? (
          <Empty icon={<Users />} title="No customers match" body="Try a different search or area." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Customer</th>
                <th className={th}>Contact</th>
                <th className={th}>Area</th>
                <th className={cn(th, 'text-right')}>Bookings</th>
                <th className={cn(th, 'text-right')}>Lifetime spend</th>
                <th className={th}>Last booking</th>
                <th className={cn(th, 'text-right')}>Wallet</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ c, bookings, spend, last }) => (
                <tr key={c.id} className={cn(tr, 'cursor-pointer')} onClick={() => setOpen(c.id)}>
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <Avatar name={c.name} size={32} side="customer" />
                      <span>
                        <span className="block font-bold">{c.name}</span>
                        <span className="num block text-xs font-medium text-muted">{c.id}</span>
                      </span>
                    </span>
                  </td>
                  <td className={td}>
                    <span className="num block text-[13px] font-semibold">{c.phone}</span>
                    <span className="block max-w-[200px] truncate text-xs text-muted">{c.email}</span>
                  </td>
                  <td className={cn(td, 'font-semibold text-ink-2')}>{c.area}</td>
                  <td className={cn(td, 'num text-right font-bold')}>{bookings.length}</td>
                  <td className={cn(td, 'num text-right font-extrabold')}>{inr(spend)}</td>
                  <td className={cn(td, 'text-[13px] font-medium text-muted')}>{last ? ago(last) : '—'}</td>
                  <td className={cn(td, 'num text-right font-semibold')}>{c.walletCredit ? inr(c.walletCredit) : '—'}</td>
                  <td className={td}>
                    <Chip tone={c.status === 'active' ? 'success' : 'danger'}>{c.status === 'active' ? 'Active' : 'Blocked'}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pager page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>

      <CustomerDrawer row={rows.find((r) => r.c.id === openId)} onClose={() => setOpen(null)} />
    </Page>
  )
}

/** One customer: who they are, their money with us, and every booking, ticket and review. */
function CustomerDrawer({ row, onClose }: { row?: Row; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const [booking, setBooking] = useState<string | null>(null)
  const [credit, setCredit] = useState(false)
  const [amount, setAmount] = useState(200)
  const [blocking, setBlocking] = useState(false)
  if (!row) return null
  const { c, bookings, spend } = row
  const rated = bookings.filter((b) => b.rating)
  const tickets = store.tickets.filter((t) => t.side === 'customer' && t.personId === c.id)
  const reviews = store.reviews.filter((r) => r.customerId === c.id)
  const blocked = c.status === 'blocked'

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={c.name}
        sub={
          <span className="flex flex-wrap items-center gap-2 pt-1">
            <span className="num">{c.id}</span>
            <Chip tone={blocked ? 'danger' : 'success'}>{blocked ? 'Blocked' : 'Active'}</Chip>
            <span>Joined {longDate(c.joinedAt)}</span>
          </span>
        }
        footer={
          <>
            <Button variant="subtle" size="sm" className={cn('mr-auto', blocked ? '' : 'text-danger hover:bg-danger-soft')} onClick={() => setBlocking(true)}>
              <Ban /> {blocked ? 'Unblock customer' : 'Block customer'}
            </Button>
            <a href={telHref(c.phone)} className={buttonClass('secondary', 'sm')}>
              <Phone /> Call
            </a>
            <Button size="sm" onClick={() => setCredit(true)}>
              <Gift /> Add credit
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size={56} side="customer" />
          <div className="min-w-0 space-y-1 text-sm font-semibold text-ink-2">
            <p className="num flex items-center gap-2">
              <Phone className="size-4 text-faint" aria-hidden /> {c.phone}
            </p>
            <p className="flex items-center gap-2 truncate">
              <Mail className="size-4 shrink-0 text-faint" aria-hidden /> {c.email}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-ink-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden /> {c.address}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Bookings', String(bookings.length)],
            ['Lifetime spend', inr(spend)],
            ['Avg rating given', rated.length ? (rated.reduce((s, b) => s + b.rating!, 0) / rated.length).toFixed(1) + '★' : '—'],
            ['Cancellations', String(bookings.filter((b) => b.status === 'cancelled' || b.status === 'refunded').length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line p-3">
              <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">{k}</dt>
              <dd className="num mt-0.5 text-base font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>

        <SectionLabel>Wallet & referrals</SectionLabel>
        <dl className="grid grid-cols-3 gap-4 rounded-card border border-line p-4">
          <Detail label="Wallet credit">
            <span className="num flex items-center gap-1.5">
              <Wallet className="size-4 text-faint" aria-hidden /> {inr(c.walletCredit)}
            </span>
          </Detail>
          <Detail label="Referral code">
            <span className="font-mono text-[13px]">{c.referralCode}</span>
          </Detail>
          <Detail label="Friends referred">{c.referrals}</Detail>
        </dl>

        <SectionLabel>Booking history · {bookings.length}</SectionLabel>
        {bookings.length === 0 ? (
          <p className="text-sm font-medium text-muted">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line">
            {bookings.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => setBooking(b.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-canvas/60">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <ApplianceGlyph appliance={b.appliance} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">
                      {BRAND_LABEL[b.brand]} {APPLIANCE_LABEL[b.appliance]} · {b.service}
                    </span>
                    <span className="block text-xs font-medium text-muted">
                      {b.id} · {dateTime(b.scheduledAt)}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="num block text-[13px] font-bold">{inr(b.amount)}</span>
                  </span>
                  <StatusChip status={b.status} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <SectionLabel>Support tickets · {tickets.length}</SectionLabel>
        {tickets.length === 0 ? (
          <p className="text-sm font-medium text-muted">No tickets raised.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/support/?id=${t.id}` as Route} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 hover:bg-canvas/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{t.subject}</span>
                    <span className="block text-xs font-medium text-muted">
                      {t.id} · {ago(t.createdAt)}
                    </span>
                  </span>
                  <Chip tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <SectionLabel>Reviews written · {reviews.length}</SectionLabel>
        {reviews.length === 0 ? (
          <p className="text-sm font-medium text-muted">No reviews yet.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Rating value={r.rating} />
                  <span className="text-xs font-medium text-faint">
                    for {store.technician(r.technicianId)?.name} · {ago(r.at)}
                  </span>
                </div>
                {r.text && <p className="mt-1 text-[13px] font-medium text-ink-2">{r.text}</p>}
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <BookingDrawer id={booking} onClose={() => setBooking(null)} />

      <Modal
        open={credit}
        onClose={() => setCredit(false)}
        title={`Add wallet credit for ${c.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCredit(false)}>
              Cancel
            </Button>
            <Button
              disabled={amount <= 0}
              onClick={() => {
                store.addWalletCredit(c.id, amount)
                toast(`${inr(amount)} credit added for ${c.name}`)
                setCredit(false)
              }}
            >
              Add {inr(amount)}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm font-medium text-muted">Credit lands in the customer’s 24X7 Wallet and applies to their next booking.</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Amount">
          {[100, 200, 500].map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={amount === v}
              onClick={() => setAmount(v)}
              className={cn('num h-12 rounded-lg border text-base font-extrabold transition-colors', amount === v ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand' : 'border-line-strong hover:border-ink-2')}
            >
              {inr(v)}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={blocking}
        onClose={() => setBlocking(false)}
        title={blocked ? `Unblock ${c.name}?` : `Block ${c.name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBlocking(false)}>
              Cancel
            </Button>
            <Button
              variant={blocked ? 'primary' : 'danger'}
              onClick={() => {
                store.setCustomerStatus(c.id, blocked ? 'active' : 'blocked')
                toast(`${c.name} ${blocked ? 'unblocked' : 'blocked'}`)
                setBlocking(false)
              }}
            >
              {blocked ? 'Unblock' : 'Block customer'}
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-muted">
          {blocked
            ? 'They will be able to sign in and book services again.'
            : 'They will not be able to place new bookings. Open bookings stay as they are until you cancel them.'}
        </p>
      </Modal>
    </>
  )
}
