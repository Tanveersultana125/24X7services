'use client'

import { useState } from 'react'
import { Bell, Database, MapPinned, ScrollText, Settings2, Siren, UserPlus, Users } from 'lucide-react'
import { useToast } from '@/components/toast'
import { Avatar, Button, Card, CardHeader, Chip, Field, Modal, Page, PageHeader, Select, Toggle, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/format'
import type { Tone } from '@/lib/status'
import { ADMIN, useStore } from '@/lib/store'
import type { ActivityKind, TeamMember } from '@/lib/types'

const SECTIONS = [
  { id: 'operations', label: 'Operations', icon: Settings2 },
  { id: 'areas', label: 'Service areas', icon: MapPinned },
  { id: 'team', label: 'Team & roles', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'audit', label: 'Audit log', icon: ScrollText },
  { id: 'demo', label: 'Demo data', icon: Database },
] as const

const ROLE_TONE: Record<TeamMember['role'], Tone> = {
  'Super admin': 'danger',
  Operations: 'brand',
  Dispatcher: 'info',
  Finance: 'success',
  Support: 'violet',
}

const KINDS: { value: 'all' | ActivityKind; label: string }[] = [
  { value: 'all', label: 'All activity' },
  { value: 'booking', label: 'Bookings' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'payment', label: 'Payments' },
  { value: 'technician', label: 'Technicians' },
  { value: 'customer', label: 'Customers' },
  { value: 'support', label: 'Support' },
  { value: 'system', label: 'System' },
]

/** How the console and the network behave, who can use it, and what they did. */
export default function SettingsPage() {
  const store = useStore()
  const toast = useToast()
  const s = store.settings
  const [sla, setSla] = useState(String(s.emergencySlaMin))
  const [inviting, setInviting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [kind, setKind] = useState<'all' | ActivityKind>('all')
  const [notify, setNotify] = useState({ emergency: true, unassigned: true, kyc: true, tickets: true, payouts: false, digest: true })
  const activeAreas = s.areas.filter((a) => a.active).length
  const log = store.activity.filter((a) => kind === 'all' || a.kind === kind)

  return (
    <Page>
      <PageHeader title="Settings" sub={`Signed in as ${ADMIN.name} · ${ADMIN.role}`} />

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        <nav aria-label="Settings sections" className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:mb-0 lg:flex-col lg:self-start lg:px-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex h-9 shrink-0 items-center gap-2.5 rounded-lg border border-line bg-card px-3 text-sm font-semibold text-ink-2 hover:bg-canvas lg:border-0 lg:bg-transparent"
            >
              <Icon className="size-4 text-muted" aria-hidden /> {label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          <Card id="operations" className="scroll-mt-24">
            <CardHeader title="Operations" sub="How bookings reach technicians" />
            <ul className="divide-y divide-line">
              <Line title="Auto-assign bookings" sub="Offer each paid booking to the nearest free certified technician. Off means dispatchers assign by hand.">
                <Toggle
                  checked={s.autoAssign}
                  label="Auto-assign"
                  onChange={(v) => {
                    store.updateSettings({ autoAssign: v })
                    toast(`Auto-assign ${v ? 'on' : 'off'}`)
                  }}
                />
              </Line>
              <Line title="Emergency response target" sub="Minutes from booking to a technician on site; emergencies past it are escalated.">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={sla}
                    onChange={(e) => setSla(e.target.value)}
                    aria-label="Emergency SLA minutes"
                    className={`${inputClass} num w-20 text-right font-bold`}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={Number(sla) === s.emergencySlaMin || !(Number(sla) >= 10 && Number(sla) <= 240)}
                    onClick={() => {
                      store.updateSettings({ emergencySlaMin: Number(sla) })
                      toast(`Emergency target set to ${sla} min`)
                    }}
                  >
                    Save
                  </Button>
                </div>
              </Line>
            </ul>
            <p className="flex items-start gap-2 border-t border-line bg-danger-soft/50 px-5 py-3 text-xs font-semibold text-ink-2">
              <Siren className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
              The emergency desk runs 24×7 — emergencies reach technicians outside their working hours if they opted in.
            </p>
          </Card>

          <Card id="areas" className="scroll-mt-24">
            <CardHeader title="Service areas" sub={`${activeAreas} of ${s.areas.length} Hyderabad pincodes accepting bookings`} />
            <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
              {s.areas.map((a, i) => (
                <li key={a.pincode} className={cn('flex items-center gap-3 px-5 py-2.5 sm:border-b sm:border-line', i % 2 === 0 && 'sm:border-r')}>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm font-bold', !a.active && 'text-muted')}>{a.area}</span>
                    <span className="num block text-xs font-semibold text-faint">{a.pincode}</span>
                  </span>
                  {!a.active && <Chip tone="neutral">Paused</Chip>}
                  <Toggle
                    size="sm"
                    checked={a.active}
                    label={`${a.area} active`}
                    onChange={(v) => {
                      store.updateSettings((cur) => ({ areas: cur.areas.map((x) => (x.pincode === a.pincode ? { ...x, active: v } : x)) }))
                      toast(`${a.area} ${v ? 'accepting bookings' : 'paused'}`)
                    }}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card id="team" className="scroll-mt-24">
            <CardHeader
              title="Team & roles"
              sub={`${s.team.length} staff with console access`}
              action={
                <Button size="sm" onClick={() => setInviting(true)}>
                  <UserPlus /> Invite member
                </Button>
              }
            />
            <ul className="divide-y divide-line">
              {s.team.map((m) => (
                <li key={m.email} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={m.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      {m.name}
                      {m.email === ADMIN.email && <span className="ml-2 text-xs font-semibold text-faint">(you)</span>}
                    </span>
                    <span className="block truncate text-xs font-medium text-muted">{m.email}</span>
                  </span>
                  <Chip tone={ROLE_TONE[m.role]}>{m.role}</Chip>
                  <span className="w-24 text-right text-xs font-semibold text-faint">Active {ago(m.lastActive)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card id="notifications" className="scroll-mt-24">
            <CardHeader title="Notifications" sub="What alerts you in the console and by email" />
            <ul className="divide-y divide-line">
              {(
                [
                  ['emergency', 'Emergency bookings', 'Instant alert when an emergency is waiting for a technician'],
                  ['unassigned', 'Unassigned bookings', 'When a paid booking has no technician 30 min before its slot'],
                  ['kyc', 'Technician applications', 'New onboarding documents to review'],
                  ['tickets', 'Urgent support tickets', 'Urgent and high-priority tickets from customers or technicians'],
                  ['payouts', 'Payout run reminders', 'Every Monday before the weekly settlement'],
                  ['digest', 'Daily email digest', 'Bookings, revenue and ratings at 9 PM'],
                ] as const
              ).map(([k, title, sub]) => (
                <Line key={k} title={title} sub={sub}>
                  <Toggle
                    checked={notify[k]}
                    label={title}
                    onChange={(v) => {
                      setNotify((n) => ({ ...n, [k]: v }))
                      toast(`${title} ${v ? 'on' : 'off'}`)
                    }}
                  />
                </Line>
              ))}
            </ul>
          </Card>

          <Card id="audit" className="scroll-mt-24">
            <CardHeader
              title="Audit log"
              sub="Every change made from the console and by the system"
              action={<Select value={kind} onChange={setKind} options={KINDS} label="Filter activity" className="h-8 py-1 text-xs" />}
            />
            <ol className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {log.length === 0 && <li className="px-5 py-8 text-center text-sm font-semibold text-muted">No activity of this kind yet.</li>}
              {log.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-2.5">
                  <Chip tone="neutral" dot={false} className="mt-0.5 w-20 justify-center capitalize">
                    {a.kind}
                  </Chip>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink-2">{a.text}</span>
                  <span className="shrink-0 text-right text-[11px] font-medium text-faint">
                    <span className="block font-semibold text-muted">{a.actor}</span>
                    {ago(a.at)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card id="demo" className="scroll-mt-24">
            <CardHeader title="Demo data" sub="This console runs on a seeded month of the Hyderabad network, saved on this device" />
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="max-w-lg text-sm font-medium text-muted">Resetting rebuilds every booking, technician, payout and ticket from the seed and clears your changes.</p>
              <Button variant="danger" onClick={() => setResetting(true)}>
                Reset demo data
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Invite open={inviting} onClose={() => setInviting(false)} />

      <Modal
        open={resetting}
        onClose={() => setResetting(false)}
        title="Reset demo data?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetting(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.resetDemo()
                setResetting(false)
                toast('Demo data reset')
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm font-medium text-muted">All assignments, refunds, payouts, coupons and settings you changed are discarded. This cannot be undone.</p>
      </Modal>
    </Page>
  )
}

function Line({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs font-medium text-muted">{sub}</span>
      </span>
      {children}
    </li>
  )
}

const ROLES: TeamMember['role'][] = ['Operations', 'Dispatcher', 'Finance', 'Support', 'Super admin']

function Invite({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMember['role']>('Dispatcher')
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const close = () => {
    setEmail('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite a team member"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              toast(`Invite sent to ${email.trim()} as ${role}`)
              close()
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Work email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@24x7services.in" className={inputClass} />
        </Field>
        <Field label="Role" hint="Roles decide which sections of the console they can change.">
          <select value={role} onChange={(e) => setRole(e.target.value as TeamMember['role'])} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  )
}
