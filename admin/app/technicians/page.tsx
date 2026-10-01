'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Check, Download, FileCheck2, FileX2, UserPlus, UserRoundCog, X } from 'lucide-react'
import { DOCS, TechnicianDrawer } from '@/components/tech-drawer'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { useToast } from '@/components/toast'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Modal,
  Page,
  PageHeader,
  Pager,
  Rating,
  SearchInput,
  Select,
  TableWrap,
  Tabs,
  Toggle,
  inputClass,
  td,
  th,
  tr,
} from '@/components/ui'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr, type Appliance, type Brand } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ago, downloadCsv, matches } from '@/lib/format'
import { KYC, PRESENCE } from '@/lib/status'
import { useStore } from '@/lib/store'
import type { Technician } from '@/lib/types'

const PAGE = 25

type TabKey = 'all' | 'online' | 'on_job' | 'offline' | 'applications' | 'suspended'

const presenceDot = { online: 'bg-success', on_job: 'bg-violet', offline: 'bg-faint' } as const

export default function TechniciansPage() {
  return (
    <Suspense>
      <Technicians />
    </Suspense>
  )
}

/** The technician network: who is working, how well, and who is waiting to join. */
function Technicians() {
  const store = useStore()
  const toast = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const openId = params.get('id')
  const [tab, setTab] = useState<TabKey>('all')
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState<Brand | 'all'>('all')
  const [appliance, setAppliance] = useState<Appliance | 'all'>('all')
  const [page, setPage] = useState(0)
  const [invite, setInvite] = useState(false)

  const t = store.technicians
  const verified = t.filter((x) => x.kyc === 'verified')
  const inTab = (x: Technician) =>
    tab === 'applications'
      ? x.kyc === 'pending'
      : tab === 'suspended'
        ? x.kyc === 'suspended' || x.kyc === 'rejected'
        : x.kyc === 'verified' && (tab === 'all' || x.presence === tab)

  const filtered = t
    .filter(inTab)
    .filter((x) => brand === 'all' || x.brands.includes(brand))
    .filter((x) => appliance === 'all' || x.appliances.includes(appliance))
    .filter((x) => matches([x.id, x.name, x.phone.replace(/\s/g, ''), x.area, x.email], q))
    .sort((a, z) => z.completedJobs - a.completedJobs)
  const pages = Math.ceil(filtered.length / PAGE)
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE)
  const setOpen = (id: string | null) => router.replace((id ? `/technicians/?id=${id}` : '/technicians') as Route, { scroll: false })
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(0)
  }

  const exportCsv = () =>
    downloadCsv('technicians', [
      ['ID', 'Name', 'Phone', 'Area', 'Status', 'KYC', 'Rating', 'Completed jobs', 'Acceptance %', 'On-time %', 'Cash in hand', 'Brands', 'Appliances'],
      ...filtered.map((x) => [
        x.id,
        x.name,
        x.phone,
        x.area,
        PRESENCE[x.presence].label,
        KYC[x.kyc].label,
        x.rating,
        x.completedJobs,
        x.acceptanceRate,
        x.onTimeRate,
        x.cashInHand,
        x.brands.map((b) => BRAND_LABEL[b]).join(' '),
        x.appliances.map((a) => APPLIANCE_LABEL[a]).join(' / '),
      ]),
    ])

  return (
    <Page>
      <PageHeader
        side="technician"
        title="Technicians"
        sub={`${verified.length} verified partners · ${verified.filter((x) => x.presence !== 'offline').length} on shift now`}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button onClick={() => setInvite(true)}>
              <UserPlus /> Invite technician
            </Button>
          </>
        }
      />

      <Card>
        <Tabs
          className="px-3"
          value={tab}
          onChange={reset(setTab)}
          options={[
            { value: 'all', label: 'All verified', count: verified.length },
            { value: 'online', label: 'Online', count: verified.filter((x) => x.presence === 'online').length },
            { value: 'on_job', label: 'On a job', count: verified.filter((x) => x.presence === 'on_job').length },
            { value: 'offline', label: 'Offline', count: verified.filter((x) => x.presence === 'offline').length },
            { value: 'applications', label: 'Applications', count: t.filter((x) => x.kyc === 'pending').length, alert: true },
            { value: 'suspended', label: 'Suspended', count: t.filter((x) => x.kyc === 'suspended' || x.kyc === 'rejected').length },
          ]}
        />
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <SearchInput className="flex-1" value={q} onChange={reset(setQ)} placeholder="Search name, ID, phone or area" />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select label="Brand" value={brand} onChange={reset(setBrand)} options={[{ value: 'all', label: 'All brands' }, ...BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] }))]} />
            <Select
              label="Appliance"
              value={appliance}
              onChange={reset(setAppliance)}
              options={[{ value: 'all', label: 'All appliances' }, ...APPLIANCES.map((a) => ({ value: a, label: APPLIANCE_LABEL[a] }))]}
            />
          </div>
        </div>

        {shown.length === 0 ? (
          <Empty
            icon={<UserRoundCog />}
            title={tab === 'applications' ? 'No applications waiting' : 'No technicians match'}
            body={tab === 'applications' ? 'New partner sign-ups show up here for KYC review.' : 'Try a different tab or filter.'}
          />
        ) : tab === 'applications' ? (
          <div className="grid gap-4 p-4 md:grid-cols-2">
            {shown.map((x) => (
              <Application key={x.id} t={x} onOpen={() => setOpen(x.id)} />
            ))}
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>Technician</th>
                <th className={th}>Area</th>
                <th className={th}>Brands</th>
                <th className={th}>Appliances</th>
                <th className={cn(th, 'text-right')}>Rating</th>
                <th className={cn(th, 'text-right')}>Jobs</th>
                <th className={cn(th, 'text-right')}>Accept.</th>
                <th className={cn(th, 'text-right')}>On-time</th>
                <th className={cn(th, 'text-right')}>Cash held</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id} className={cn(tr, 'cursor-pointer')} onClick={() => setOpen(x.id)}>
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <span className="relative">
                        <Avatar name={x.name} size={32} side="technician" />
                        <span className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card', presenceDot[x.presence])} />
                      </span>
                      <span>
                        <span className="block whitespace-nowrap font-bold">{x.name}</span>
                        <span className="num block text-xs font-medium text-muted">{x.id}</span>
                      </span>
                    </span>
                  </td>
                  <td className={cn(td, 'whitespace-nowrap font-semibold text-ink-2')}>{x.area}</td>
                  <td className={td}>
                    <span className="flex flex-wrap gap-1">
                      {x.brands.map((b) => (
                        <BrandTag key={b} brand={b} />
                      ))}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="flex gap-1 text-muted">
                      {x.appliances.map((a) => (
                        <span key={a} title={APPLIANCE_LABEL[a]}>
                          <ApplianceGlyph appliance={a} className="size-4" />
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <Rating value={x.rating} />
                  </td>
                  <td className={cn(td, 'num text-right font-bold')}>{x.completedJobs.toLocaleString('en-IN')}</td>
                  <td className={cn(td, 'num text-right font-semibold')}>{x.acceptanceRate ? `${x.acceptanceRate}%` : '—'}</td>
                  <td className={cn(td, 'num text-right font-semibold')}>{x.onTimeRate ? `${x.onTimeRate}%` : '—'}</td>
                  <td className={cn(td, 'num text-right font-semibold', x.cashInHand > 5000 && 'text-warning')}>{x.cashInHand ? inr(x.cashInHand) : '—'}</td>
                  <td className={td}>
                    {x.kyc === 'verified' ? <Chip tone={PRESENCE[x.presence].tone}>{PRESENCE[x.presence].label}</Chip> : <Chip tone={KYC[x.kyc].tone}>{KYC[x.kyc].label}</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pager page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>

      <TechnicianDrawer t={t.find((x) => x.id === openId)} onClose={() => setOpen(null)} />

      <InviteModal
        open={invite}
        onClose={() => setInvite(false)}
        onSent={(name) => {
          setInvite(false)
          toast(`Invite sent to ${name}`)
        }}
      />
    </Page>
  )
}

/** A KYC application: the documents on file and the decision. */
function Application({ t, onOpen }: { t: Technician; onOpen: () => void }) {
  const store = useStore()
  const toast = useToast()
  const missing = DOCS.filter((d) => !t.docs[d.key])
  const canApprove = store.can('technicians', 'approve')
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 text-left">
        <Avatar name={t.name} size={44} side="technician" />
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold hover:text-brand">{t.name}</span>
          <span className="block text-xs font-semibold text-muted">
            {t.id} · {t.experienceYears} yrs exp. · {t.area}
          </span>
        </span>
        <span className="text-[11px] font-semibold text-faint">Applied {ago(t.joinedAt)}</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1">
        {t.brands.map((b) => (
          <BrandTag key={b} brand={b} />
        ))}
        <span className="ml-1 flex gap-1 text-muted">
          {t.appliances.map((a) => (
            <span key={a} title={APPLIANCE_LABEL[a]}>
              <ApplianceGlyph appliance={a} className="size-4" />
            </span>
          ))}
        </span>
      </div>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {DOCS.map((d) => (
          <li key={d.key} className="flex items-center gap-3 px-3 py-2">
            {t.docs[d.key] ? <FileCheck2 className="size-4 text-success" aria-hidden /> : <FileX2 className="size-4 text-faint" aria-hidden />}
            <span className={cn('flex-1 text-[13px] font-semibold', t.docs[d.key] ? 'text-ink' : 'text-muted')}>{d.label}</span>
            <Toggle size="sm" checked={t.docs[d.key]} onChange={(v) => canApprove && store.setDoc(t.id, d.key, v)} label={`${d.label} verified`} />
          </li>
        ))}
      </ul>
      <p className={cn('mt-3 text-xs font-semibold', missing.length ? 'text-warning' : 'text-success')}>
        {missing.length ? `Missing: ${missing.map((d) => d.label).join(', ')}` : 'All documents verified — ready to approve'}
      </p>
      {canApprove && <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 text-danger"
          onClick={() => {
            store.setKyc(t.id, 'rejected')
            toast(`${t.name}’s application rejected`)
          }}
        >
          <X /> Reject
        </Button>
        <Button
          variant="success"
          size="sm"
          className="flex-1"
          disabled={missing.length > 0}
          onClick={() => {
            store.setKyc(t.id, 'verified')
            toast(`${t.name} approved and onboarded`)
          }}
        >
          <Check /> Approve
        </Button>
      </div>}
    </div>
  )
}

function InviteModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: (name: string) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a technician"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSent(name.trim())
              setName('')
              setPhone('')
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm font-medium text-muted">They get an SMS link to the Technician Partner app to sign up and upload KYC documents.</p>
      <div className="space-y-3">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Mobile number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+91" className={inputClass} />
        </Field>
      </div>
    </Modal>
  )
}
