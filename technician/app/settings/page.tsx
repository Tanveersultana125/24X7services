'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, CircleCheck, ChevronRight, Download, Headset, KeyRound, Languages, Landmark, LogOut, QrCode as QrIcon, RotateCcw, Share2, Siren, Smartphone, UserRound, Volume2 } from 'lucide-react'
import { AvailabilitySettings } from '@/components/Availability'
import { QrCode, downloadQr, upiLink } from '@/components/UpiQr'
import { Avatar, Button, Card, Field, Page, ScreenHeader, SectionTitle, Segmented, Sheet, Toggle, inputClass } from '@/components/ui'
import { chime } from '@/lib/chime'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { useStore, useTick } from '@/lib/store'
import type { Settings } from '@/lib/types'

type SheetName = 'payment' | 'scanner' | 'account' | 'password' | 'devices' | 'logout'

/** Each switch says in its own row what it is doing right now. */
const NOTIFY_ROWS: { key: keyof Settings['notify']; title: string; on: string; off: string }[] = [
  { key: 'requests', title: 'New service requests', on: 'Pop-up for each new job in your shift', off: 'New jobs wait quietly in Jobs' },
  { key: 'emergency', title: 'Emergency requests', on: 'Full-screen alert, even off shift', off: 'Emergencies wait quietly in Jobs' },
  { key: 'schedule', title: 'Schedule changes & cancellations', on: 'Notified when a job moves or is cancelled', off: 'No schedule notifications' },
  { key: 'payments', title: 'Payments & ratings', on: 'Notified for every payment and rating', off: 'No payment or rating notifications' },
  { key: 'sound', title: 'Alert sound', on: 'A chime plays with every alert', off: 'Alerts arrive silently' },
]

const NOTIFY_LABEL: Record<keyof Settings['notify'], string> = {
  requests: 'New request alerts',
  emergency: 'Emergency alerts',
  schedule: 'Schedule alerts',
  payments: 'Payment & rating alerts',
  sound: 'Alert sound',
}

export default function SettingsPage() {
  const store = useStore()
  const router = useRouter()
  const t = useT()
  const now = useTick(60_000)
  const { settings: s, updateSettings } = store
  const [sheet, setSheet] = useState<null | SheetName>(null)
  const [toast, setToast] = useState<string | null>(null)
  const notify = (k: keyof Settings['notify'], v: boolean) => {
    updateSettings((cur) => ({ notify: { ...cur.notify, [k]: v } }))
    if (k === 'sound' && v) chime()
    flash(`${NOTIFY_LABEL[k]} ${v ? 'on' : 'off'}`)
  }
  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const passwordAge = Math.floor((now - new Date(s.passwordChangedAt).getTime()) / 86_400_000)

  return (
    <>
      <ScreenHeader back="/profile" title={t('Settings')} />
      <Page className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <AvailabilitySettings />

            <section>
              <SectionTitle>{t('Language')}</SectionTitle>
              <Card className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                  <Languages className="size-4 text-ink-2" /> {t('App language')}
                </p>
                <Segmented
                  value={s.language}
                  onChange={(v) => updateSettings({ language: v })}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'हिन्दी', label: 'हिन्दी' },
                    { value: 'తెలుగు', label: 'తెలుగు' },
                    { value: 'اردو', label: 'اردو' },
                  ]}
                />
              </Card>
            </section>
          </div>

          <div className="space-y-5">
            <section>
              <SectionTitle>{t('Notifications')}</SectionTitle>
              <Card className="divide-y divide-line">
                {NOTIFY_ROWS.map((r) => (
                  <NotifyLine key={r.key} icon={r.key === 'sound' ? <Volume2 className="size-4" /> : r.key === 'emergency' ? <Siren className="size-4" /> : <Bell className="size-4" />} title={t(r.title)} on={s.notify[r.key]} onText={t(r.on)} offText={t(r.off)}>
                    <Toggle checked={s.notify[r.key]} onChange={(v) => notify(r.key, v)} label={r.title} />
                  </NotifyLine>
                ))}
              </Card>
            </section>

            <section>
              <SectionTitle>{t('Account')}</SectionTitle>
              <Card className="divide-y divide-line">
                <Nav icon={<QrIcon className="size-4" />} title={t('My payment scanner')} sub={t('Your UPI QR for customers to scan')} onClick={() => setSheet('scanner')} />
                <Nav icon={<Landmark className="size-4" />} title={t('Payment settings')} sub={`${s.bank} · ${s.upi}`} onClick={() => setSheet('payment')} />
                <Nav icon={<UserRound className="size-4" />} title={t('Account settings')} sub={t('Password, fingerprint, devices')} onClick={() => setSheet('account')} />
                <Link href="/support" className="flex items-center gap-3 p-4 hover:bg-canvas">
                  <span className="grid size-9 place-items-center rounded-lg bg-canvas text-ink-2">
                    <Headset className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-extrabold">{t('Help & Support')}</span>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
                <Nav
                  icon={<RotateCcw className="size-4" />}
                  title={t('Reset demo data')}
                  sub={t('Reload today’s sample jobs')}
                  onClick={() => {
                    store.resetDemo()
                    flash('Demo data reset')
                  }}
                />
              </Card>
            </section>
            <button
              type="button"
              onClick={() => setSheet('logout')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-danger/30 bg-card text-base font-extrabold text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-5" /> {t('Logout')}
            </button>
            <p className="text-center text-xs font-semibold text-faint">24X7 Technician Partner · v0.1.0</p>
          </div>
        </div>
      </Page>

      <PaymentSheet
        open={sheet === 'payment'}
        onClose={() => setSheet(null)}
        onSave={(bank, upi) => {
          updateSettings({ bank, upi })
          setSheet(null)
          flash('Payment settings saved')
        }}
      />

      <ScannerSheet open={sheet === 'scanner'} onClose={() => setSheet(null)} onEdit={() => setSheet('payment')} flash={flash} />

      <Sheet open={sheet === 'account'} onClose={() => setSheet(null)} title={t('Account settings')}>
        <div className="-mx-4 -my-4 divide-y divide-line">
          <Nav
            icon={<KeyRound className="size-4" />}
            title="Change password"
            sub={passwordAge <= 0 ? 'Changed today' : `Last changed ${passwordAge} day${passwordAge === 1 ? '' : 's'} ago`}
            onClick={() => setSheet('password')}
          />
          <Line icon={<Smartphone className="size-4" />} title="Fingerprint sign-in" sub={s.fingerprint ? 'On for this device' : 'Off · sign in with OTP'}>
            <Toggle
              checked={s.fingerprint}
              onChange={(v) => {
                updateSettings({ fingerprint: v })
                flash(`Fingerprint sign-in ${v ? 'on' : 'off'}`)
              }}
              label="Fingerprint sign-in"
            />
          </Line>
          <Nav
            icon={<Smartphone className="size-4" />}
            title="Signed-in devices"
            sub={`${s.devices.length + 1} active · this phone${s.devices.length ? ` + ${s.devices.length} more` : ''}`}
            onClick={() => setSheet('devices')}
          />
        </div>
      </Sheet>

      <PasswordSheet
        open={sheet === 'password'}
        onClose={() => setSheet('account')}
        onSave={() => {
          updateSettings({ passwordChangedAt: new Date().toISOString() })
          setSheet('account')
          flash('Password updated')
        }}
      />

      <Sheet open={sheet === 'devices'} onClose={() => setSheet('account')} title="Signed-in devices">
        <ul className="-mx-4 -my-4 divide-y divide-line">
          <li className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <Smartphone className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">This phone</p>
              <p className="text-xs font-medium text-success">Active now</p>
            </div>
          </li>
          {s.devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
                <Smartphone className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{d.name}</p>
                <p className="text-xs font-medium text-muted">Last active {ago(d.lastActive)}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  updateSettings({ devices: s.devices.filter((x) => x.id !== d.id) })
                  flash(`Signed out ${d.name.split(' · ')[0]}`)
                }}
              >
                Sign out
              </Button>
            </li>
          ))}
        </ul>
        {s.devices.length === 0 && <p className="mt-6 text-center text-xs font-medium text-muted">No other device is signed in to your account.</p>}
      </Sheet>

      <Sheet open={sheet === 'logout'} onClose={() => setSheet(null)} title="Log out?">
        <p className="text-sm text-muted">You’ll go offline and stop receiving requests. Jobs in progress stay assigned to you.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setSheet(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            onClick={() => {
              store.setOnline(false)
              store.signOut()
              router.replace('/login')
            }}
          >
            {t('Logout')}
          </Button>
        </div>
      </Sheet>

      {toast && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+0.75rem)] z-[80] flex justify-center px-4">
          <p className="animate-slide-up flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-float">
            <CircleCheck className="size-4 text-[#4ade80]" /> {toast}
          </p>
        </div>
      )}
    </>
  )
}

/**
 * The technician's own counter scanner: a static UPI QR any customer can scan
 * and pay into, the way a shop keeps one by the till. Bills show a QR with the
 * amount filled in; this one leaves the amount to the customer.
 */
function ScannerSheet({ open, onClose, onEdit, flash }: { open: boolean; onClose: () => void; onEdit: () => void; flash: (m: string) => void }) {
  const { settings, tech } = useStore()
  const link = upiLink({ upi: settings.upi, name: tech.name })
  const file = `${tech.name.replace(/\s+/g, '-')}-UPI-QR.png`

  return (
    <Sheet open={open} onClose={onClose} title="My payment scanner">
      <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center gap-3 bg-brand-ink px-4 py-3 text-white">
          <Avatar name={tech.name} photo={tech.photo} size={36} className="ring-2 ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight">{tech.name}</p>
            <p className="num truncate text-[11px] font-semibold text-white/60">{tech.id}</p>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-extrabold tracking-[0.14em]">UPI</span>
        </div>

        <div className="px-6 pb-3 pt-5">
          <QrCode text={link} className="mx-auto aspect-square w-full max-w-[216px]" label={`UPI QR for ${settings.upi}`} />
          <p className="mt-3 text-center text-[11px] font-semibold text-muted">Scan with GPay, PhonePe, Paytm or any UPI app</p>
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-faint">UPI ID</p>
            <p className="num truncate text-sm font-extrabold">{settings.upi}</p>
          </div>
          <button type="button" onClick={onEdit} className="h-9 shrink-0 rounded-lg px-3 text-sm font-bold text-brand hover:bg-brand-soft">
            Change
          </button>
        </div>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2.5">
        <Button
          variant="secondary"
          onClick={async () => {
            await downloadQr(link, file)
            flash('Scanner saved as PNG')
          }}
        >
          <Download className="size-4" /> Download
        </Button>
        <Button
          onClick={async () => {
            try {
              if (navigator.share) {
                await navigator.share({ title: `Pay ${tech.name}`, text: `Pay ${tech.name} on UPI: ${settings.upi}` })
                return
              }
              await navigator.clipboard.writeText(settings.upi)
              flash('UPI ID copied')
            } catch {
              /* share sheet dismissed */
            }
          }}
        >
          <Share2 className="size-4" /> Share
        </Button>
      </div>
    </Sheet>
  )
}

/** Edits a draft, so closing the sheet without saving leaves the account as it was. */
function PaymentSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (bank: string, upi: string) => void }) {
  const { settings } = useStore()
  const [bank, setBank] = useState(settings.bank)
  const [upi, setUpi] = useState(settings.upi)
  const [wasOpen, setWasOpen] = useState(open)
  // Reset the draft to the saved values each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setBank(settings.bank)
      setUpi(settings.upi)
    }
  }
  const upiOk = /^[\w.-]{2,}@[a-z]{2,}$/i.test(upi.trim())
  const ok = bank.trim().length > 2 && upiOk

  return (
    <Sheet open={open} onClose={onClose} title="Payment settings">
      <div className="space-y-4">
        <Field label="Payout bank account">
          <input value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass} />
        </Field>
        <Field label="UPI ID for collections" hint={upi && !upiOk ? <span className="text-danger">Enter a UPI ID like name@okhdfc</span> : 'Shown to customers on the bill QR'}>
          <input value={upi} onChange={(e) => setUpi(e.target.value)} className={inputClass} autoCapitalize="none" autoCorrect="off" />
        </Field>
        <Button size="lg" className="w-full" disabled={!ok} onClick={() => onSave(bank.trim(), upi.trim())}>
          Save
        </Button>
      </div>
    </Sheet>
  )
}

function PasswordSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    setCurrent('')
    setNext('')
    setAgain('')
  }
  const error =
    next && next.length < 8 ? 'Use at least 8 characters' : next && current && next === current ? 'Pick a password you haven’t used here' : again && again !== next ? 'Passwords don’t match' : null
  const ok = current.length > 0 && next.length >= 8 && next === again && next !== current

  return (
    <Sheet open={open} onClose={onClose} title="Change password">
      <div className="space-y-4">
        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="New password">
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Confirm new password" hint={error ? <span className="text-danger">{error}</span> : 'At least 8 characters'}>
          <input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className={inputClass} />
        </Field>
        <Button size="lg" className="w-full" disabled={!ok} onClick={onSave}>
          Update password
        </Button>
      </div>
    </Sheet>
  )
}

function NotifyLine({ icon, title, on, onText, offText, children }: { icon: React.ReactNode; title: string; on: boolean; onText: string; offText: string; children: React.ReactNode }) {
  const t = useT()
  return (
    <div className="flex items-center gap-3 p-4">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg transition-colors', on ? 'bg-brand-soft text-brand' : 'bg-canvas text-faint')}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-muted">
          <span className={cn('font-extrabold', on ? 'text-success' : 'text-faint')}>{on ? `● ${t('On')}` : `○ ${t('Off')}`}</span> · {on ? onText : offText}
        </p>
      </div>
      {children}
    </div>
  )
}

function Line({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        {sub && <p className="truncate text-xs font-medium text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Nav({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left hover:bg-canvas">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        {sub && <span className="block truncate text-xs font-medium text-muted">{sub}</span>}
      </span>
      <ChevronRight className="size-4 text-faint" />
    </button>
  )
}
